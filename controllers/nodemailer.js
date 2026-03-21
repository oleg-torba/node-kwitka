const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendAlkoNotification = async (data) => {
  const { brand, model, serial, master, repairNumber } = data;

  if (brand?.trim().toUpperCase() === 'AL-KO') {
    const mailOptions = {
      from: `"Квітка Сервіс" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_MANAGER,
      subject: `⚠️ Гарантія AL-KO: ${repairNumber}`,
      html: `<b>Майстер ${master}</b> додав нову гарантійку AL-KO'`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Повідомлення по AL-KO надіслано');
    } catch (err) {
      console.error('❌ Помилка Nodemailer:', err);
    }
  }
};

module.exports = { sendAlkoNotification };