-- =====================================================
-- DATABASE SCHEMA FOR SAAS BACKEND
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- WALLETS TABLE
-- =====================================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    balance DECIMAL(20, 8) DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_frozen BOOLEAN DEFAULT false,
    frozen_reason VARCHAR(255),
    daily_transfer_limit DECIMAL(20, 8) DEFAULT 1000.00,
    daily_transfer_used DECIMAL(20, 8) DEFAULT 0.00,
    daily_transfer_reset_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_wallets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_balance_non_negative
        CHECK (balance >= 0),

    CONSTRAINT chk_daily_transfer_limit_positive
        CHECK (daily_transfer_limit > 0),

    CONSTRAINT chk_daily_transfer_used_non_negative
        CHECK (daily_transfer_used >= 0)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_is_frozen ON wallets(is_frozen);

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRANSACTIONS TABLE (Immutable Ledger)
-- =====================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (
        type IN (
            'topup',
            'transfer_in',
            'transfer_out',
            'ai_deduction',
            'refund',
            'withdrawal',
            'admin_adjustment',
            'p2p_debit',
            'p2p_credit'
        )
    ),
    amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
    balance_before DECIMAL(20, 8) NOT NULL,
    balance_after DECIMAL(20, 8) NOT NULL,
    description VARCHAR(500),
    reference_id VARCHAR(255),
    related_user_id UUID,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'completed' CHECK (
        status IN ('pending', 'completed', 'failed', 'reversed')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_transactions_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_balance_after_non_negative
        CHECK (balance_after >= 0),

    CONSTRAINT chk_balance_before_non_negative
        CHECK (balance_before >= 0)
);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_wallet_created
    ON transactions(wallet_id, created_at DESC);

-- Prevent UPDATE and DELETE on transactions (Immutable)
CREATE OR REPLACE FUNCTION prevent_transaction_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Transactions are immutable and cannot be modified or deleted';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_transaction_update
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_transaction_modification();

CREATE TRIGGER trg_prevent_transaction_delete
    BEFORE DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_transaction_modification();

-- =====================================================
-- PAYOUT REQUESTS TABLE
-- =====================================================
CREATE TABLE payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
    amount_iqd DECIMAL(20, 2) NOT NULL CHECK (amount_iqd > 0),
    exchange_rate DECIMAL(20, 8) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (
        payment_method IN ('bank_transfer', 'zain_cash', 'fast_pay', 'usdt')
    ),
    payment_details JSONB NOT NULL,
    reference_number VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'rejected')
    ),
    admin_notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_payout_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payout_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payout_processed_by
        FOREIGN KEY (processed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE INDEX idx_payout_requests_created_at ON payout_requests(created_at DESC);

CREATE TRIGGER update_payout_requests_updated_at
    BEFORE UPDATE ON payout_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AI USAGE LOGS TABLE
-- =====================================================
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    transaction_id UUID,
    model_name VARCHAR(100) NOT NULL,
    prompt_tokens INT NOT NULL CHECK (prompt_tokens >= 0),
    completion_tokens INT NOT NULL CHECK (completion_tokens >= 0),
    total_tokens INT NOT NULL CHECK (total_tokens >= 0),
    credits_cost DECIMAL(20, 8) NOT NULL CHECK (credits_cost > 0),
    request_payload JSONB,
    response_payload JSONB,
    processing_time_ms INT,
    status VARCHAR(20) DEFAULT 'success' CHECK (
        status IN ('success', 'failed', 'timeout', 'rate_limited', 'pending')
    ),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_ai_usage_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ai_usage_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ai_usage_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_ai_usage_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_model_name ON ai_usage_logs(model_name);
CREATE INDEX idx_ai_usage_created_at ON ai_usage_logs(created_at DESC);

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
