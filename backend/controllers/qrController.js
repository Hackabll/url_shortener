const QRCode = require("qrcode");

exports.generateQR = async (req,res) =>{

    const code = req.params.code;
    const url="http://localhost:3000/"+code;
    const qr = await QRCode.toDataURL(url);
    res.json({qr});
};
