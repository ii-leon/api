const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Mlpmlp09',
  database: 'saas_db',
  synchronize: false,
  logging: true,
});

async function resetAll() {
  try {
    await AppDataSource.initialize();
    console.log('تم الاتصال بقاعدة البيانات');

    // 1. إعادة تعيين جميع الأرصدة
    await AppDataSource.query(`
      UPDATE wallets 
      SET balance = 0, 
          daily_transfer_used = 0,
          daily_transfer_limit = 10000
    `);
    console.log('✓ تم إعادة تعيين جميع الأرصدة');

    // 2. حذف جميع المعاملات
    await AppDataSource.query('DELETE FROM transactions');
    console.log('✓ تم حذف جميع المعاملات');

    // 3. حذف جميع جلسات الدفع
    await AppDataSource.query('DELETE FROM checkout_sessions');
    console.log('✓ تم حذف جميع جلسات الدفع');

    // 4. عرض الأرصدة الحالية
    const wallets = await AppDataSource.query('SELECT user_id, balance, currency FROM wallets');
    console.log('\nالأرصدة الحالية:');
    wallets.forEach(w => {
      console.log(`  المستخدم: ${w.user_id} | الرصيد: ${w.balance} ${w.currency}`);
    });

    console.log('\n✓ تم إعادة تعيين جميع البيانات بنجاح');
    process.exit(0);
  } catch (error) {
    console.error('خطأ:', error);
    process.exit(1);
  }
}

resetAll();
