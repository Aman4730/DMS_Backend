const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const SMTP = require("../models/adminSMTP");
const app = express();
app.use(bodyParser.json());
const nodemailer = require("nodemailer");

router.post("/createsmtp", (req, res) => {
  const {
    username,
    password,
    host_serverip,
    port,
    from_address,
    security,
    from_name,
    authentication,
  } = req.body;

  SMTP.create({
    username,
    password,
    host_serverip,
    port,
    security,
    smtp_status: false,
    from_address,
    from_name,
    authentication,
  })
    .then((createdSMTP) => {
      res.status(201).json(createdSMTP);
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed To Create SMTP Credential." });
    });
});

// Edit SMTP credentials

router.post("/editsmtp", async (req, res) => {
  try {
    const smtpId = req.body.id;
    const {
      username,
      password,
      host_serverip,
      port,
      security,
      from_address,
      from_name,
      authentication,
      smtp_status,
    } = req.body;

    if (smtp_status === true && smtpId) {
      await SMTP.update({ smtp_status: false },{
        where:{
          smtp_status:true
        }
      });
      let [numberOfUpdatedRows, updatedRows] = await SMTP.update(
        { smtp_status: true },
        {
          where: {
            id: smtpId,
          },
          returning: true, 
          raw: true,       
        }
      );
      
      if (numberOfUpdatedRows > 0) {
        let updated_smtp = updatedRows[0]; 
      
        return res
          .status(200)
          .send({ message: `SMTP ${updated_smtp.from_name} In Use` });
      } else {
        return res.status(404).send({ message: 'SMTP not found' });
      }
    } else {
      SMTP.findByPk(smtpId)
        .then((smtp) => {
          if (smtp) {
            smtp
              .update({
                username,
                password,
                host_serverip,
                port,
                security,
                from_address,
                from_name,
                authentication,
              })
              .then((updatedSMTP) => {
                res.status(200).json(updatedSMTP);
              })
              .catch((error) => {
                res
                  .status(500)
                  .json({ error: "Failed To Update SMTP Credential." });
              });
          } else {
            res.status(404).json({ error: "SMTP Credential Not Found." });
          }
        })
        .catch((error) => {
          res.status(500).json({ error: "Failed To Retrieve SMTP Credential" });
        });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
});

router.post("/getsmtp", async (req, res) => {
  try {
    const data = await SMTP.findAll();
    if(data.length<=0){
      return res.status(200).send({data:[]})
    }

    const firstDocumentWithSmtpStatusTrue = data.find(item => item.smtp_status === true);

    const restOfData = data.filter(item => item !== firstDocumentWithSmtpStatusTrue);

    const sortedRestOfData = restOfData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const responseData = [firstDocumentWithSmtpStatusTrue, ...sortedRestOfData];

    return res.status(200).json({ data: responseData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post("/testemail", async (req, res) => {
  try {
    const { to_address, subject, message } = req.body;
   
    const data = await SMTP.findOne({
      where: {
        smtp_status: true,
      },
      raw: true,
    });

    let transporterOptions = {
      host: data.host_serverip,
      port: data.port,
      auth: {
        user: data.username,
        pass: data.password,
      },
    };
    if (data.authentication === "Yes" && data.security === "TLS") {
      transporterOptions.secure = true;
      transporterOptions.tls = {
        rejectUnauthorized: false,
      };
    } else {
      transporterOptions.secure = false;
    }

    const transporter = nodemailer.createTransport(transporterOptions);

    const mailOptions = {
      from: `ACME DocHub ${data.from_address}`,
      to: to_address,
      subject: subject,
      html: `<HTML>  
    <p style="font-family: Calibri;">Dear ${to_address},</p>
    <h4 style="font-family: Calibri;">This Is Test Email. </h4>
    <p>${message}</p>
          
    <p style="font-family: Calibri;">Regards,</p>
    <img src="cid:acmeLogo" alt="acme_logo">
    <p style="font-family: Calibri;">ACME DocHub</p>
    <HTML>`,
      attachments: [
        {
          filename: "acmeLogoEmail.png",
          path: "img/acmeLogoEmail.png",
          cid: "acmeLogo",
        },
      ],
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error, "__this is error");
      } else {
        console.log(info, "all are perfect");
        return res
          .status(200)
          .json({ success: true, message: "Email Sent Successfully " });
      }
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Server Error" });
  }
});

router.post("/deletesmtp", async (req, res) => {
  try {
    let { id } = req.body;
    let deleteSmtp = await SMTP.destroy({
      where: {
        id: id,
      },
    });
    return res
      .status(200)
      .send({
        status: true,
        message: `${deleteSmtp.from_name} SMTP Deleted Sucessfully`,
      });
  } catch (error) {
    return res.status(500).send({ status: false, message: "Server Error" });
  }
});

module.exports = router;
