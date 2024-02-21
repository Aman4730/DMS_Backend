const express = require("express");
const router = express.Router();
const Guestsignup = require("../../models/link_sharing/guestsignup");
const Guest = require("../../models/link_sharing/linksharing");
const bcrypt = require("bcrypt");
const jwtgenerator = require("../../util/jwtGenerator");
const middleware = require("../../middleware/authorization");
const FileUpload = require("../../models/fileupload");
const Folder = require("../../models/folder");
// Define a route to fetch and convert the blob data
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const Alllogs = require("../../models/logsdetails/alllogs");
// const guest = require('../../models/link_sharing/linksharing')
const User = require("..//../models/add_user");
const workspace = require("../../models/add_workspace");
const SMTP = require("../../models/adminSMTP");
const { Op } = require("sequelize");
const { extractClientIP } = require("../../middleware/clientIp");

router.use(extractClientIP);

router.post("/guestsignup", middleware, async (req, res) => {
  const clientIP = req.clientIP;
  let {
    user_type,
    link_expiry,
    email,
    subject,
    password,
    view,
    share,
    rename,
    move,
    rights,
    comment,
    properties,
    delete_action,
    download,
    id,
    file_type,
    message,
    create_folder,
    upload_file,
    upload_folder,
    user_email,
    workspace_name,
    workspace_type,
    name,
  } = req.body;
  if (user_email) {
    email = user_email;
  }
  email = email.toLowerCase();

  const date = new Date(link_expiry);

  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  const formattedDate = date.toLocaleDateString("en-GB", options);

  if (!email) {
    return res
      .status(400)
      .send({ message: "Please Enter Email Before Sharing" });
  }

  const email1 = req.decodedToken.user.username;
  let file_id;
  let folder_id;
  if (file_type) {
    file_id = id;
  } else {
    folder_id = id;
  }

  try {
    const smtp_details = await SMTP.findOne({
      where: {
        smtp_status: true,
      },
      raw: true,
    });
    let transporterOptions = {
      host: smtp_details.host_serverip,
      port: smtp_details.port,
      auth: {
        user: smtp_details.username,
        pass: smtp_details.password,
      },
    };

    if (
      smtp_details.authentication === "Yes" &&
      smtp_details.security === "TLS"
    ) {
      transporterOptions.secure = true;
      transporterOptions.tls = {
        rejectUnauthorized: false,
      };
    } else {
      transporterOptions.secure = false;
    }

    if (user_type === "Guest") {
      const user = await Guestsignup.findOne({
        where: {
          email: email,
        },
      });
      const hash = await bcrypt.hash(password, 10);
      if (user) {
        await Guestsignup.update(
          {
            password: password,
            hash_password: hash,
          },
          {
            where: {
              email: email,
            },
          }
        );
      } else {
        await Guestsignup.create({
          email: email,
          password: password,
          hash_password: hash,
          user_status: "active",
        });
      }
      let createdDocument = await Guest.create({
        file_id: file_id || null,
        folder_id: folder_id || null,
        guest_email: email,
        share: share,
        rename: rename,
        move: move,
        rights: rights,
        comment: comment,
        properties: properties,
        delete_action: delete_action,
        expiry_date: link_expiry,
        view: view,
        download: download,
        create_folder: create_folder,
        upload_file: upload_file,
        upload_folder: upload_folder,
        shared_by: email1,
      });

      const transporter = nodemailer.createTransport(transporterOptions);

      const htmlContent = `<html>
   <p style="font-family: Calibri;">Dear ${email},<p>
   <p style="font-family: Calibri;">${message}</p>
   <p style="font-family: Calibri;">The following content has been shared with you:</p>
   <p style="font-family: Calibri;">${
     file_type ? "<strong>File</strong>" : "<strong>Folder</strong>"
   } <strong>Name:</strong> ${req.body.name} <br> 
    <strong>Your password is:</strong> ${password}<br>
   <strong>This link is valid until:</strong> ${formattedDate}</p>
   <p style="font-family: Calibri;">
   To access the content, click the following link to login:
     <a 
       href="${process.env.HOST_FRONTEND}/guestlogin"
       ><strong>Login Link</strong></a
     >
   </p>
   <p style="font-family: Calibri; margin-bottom :0px">Regards,</p>
   <img src="cid:acmeLogo" alt="acme_logo">
   <p style="font-family: Calibri; margin-top :3px">ACME DocHub</p>
   </html>`;
      const mailOptions = {
        from: `ACME DocHub <${smtp_details.from_address}>`,
        to: email,
        subject: `ACME DocHub - Content has been shared. ${subject}`,
        html: htmlContent,
        attachments: [
          {
            filename: "acmeLogoEmail.png",
            path: "img/acmeLogoEmail.png",
            cid: "acmeLogo",
          },
        ],
      };

      transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "An Error Occurred While Sending The Email",
          });
        } else {
          let storeName;
          if (file_id) {
            let fileName = await FileUpload.findOne({ where: { id: file_id } });
            storeName = fileName.file_name;
          } else if (folder_id) {
            let folderName = await Folder.findOne({
              where: { id: folder_id },
              attributes: ["folder_name"],
            });
            storeName = folderName.folder_name;
          }
          // let user_check =await User.findOne({where:{
          //   email:email1,

          // }})
          // if(user_check.user_type ==="Admin"){
          await Guest.update(
            {
              // shared_workspace_name:,
              is_approved1: "true",
              is_approved2: "true",
            },
            {
              where: {
                id: createdDocument.id,
              },
            }
          );
          // }
          const loggsfolder = await Alllogs.create({
            user_id: email1,
            category: "Shared",
            action: `${storeName} has been Shared to Guest : ${email}`,
            timestamp: Date.now(),
            system_ip: clientIP,
          });
          return res
            .status(200)
            .json({ success: true, message: "Link Sent Successfully" });
        }
      });
    } else {
      //  Guest model is also saved user to user file sharing data
      let createdDocument = await Guest.create({
        file_id: file_id || null,
        folder_id: folder_id || null,
        user_email: email,
        share: share,
        rename: rename,
        move: move,
        rights: rights,
        comment: comment,
        properties: properties,
        delete_action: delete_action,
        expiry_date: link_expiry,
        view: view,
        download: download,
        create_folder: create_folder,
        upload_file: upload_file,
        upload_folder: upload_folder,
        shared_by: email1,
        shared_workspace_name: workspace_name,
      });
      let storeName;
      let fileName;
      let folderName;
      if (file_id) {
        fileName = await FileUpload.findOne({
          where: { id: file_id },
          attributes: ["workspace_name", "file_name"],
        });
        storeName = fileName.file_name;
      } else if (folder_id) {
        folderName = await Folder.findOne({
          where: { id: folder_id },
          attributes: ["folder_name", "workspace_name"],
        });
        storeName = folderName.folder_name;
      }
      // let workSpaceNameFromFolderOrFile;
      // if (fileName && fileName.dataValues.workspace_name) {
      //   workSpaceNameFromFolderOrFile = fileName.dataValues.workspace_name;
      // } else if (folderName && folderName.dataValues.workspace_name) {
      //   workSpaceNameFromFolderOrFile = folderName.dataValues.workspace_name;
      // }
      // console.log(workSpaceNameFromFolderOrFile,"_______workSpaceNameFromFolderOrFile")
      // const transporter = nodemailer.createTransport({
      //   host: `${process.env.HOST_SMTP}`,
      //   port: `${process.env.PORT_SMPT}`,
      //   secure: false,
      //   auth: {
      //     user: `${process.env.USER_SMTP}`,
      //     pass: `${process.env.PASS_SMTP}`,
      //   },
      //   tls: {
      //     rejectUnauthorized: false,
      //   },
      // });
      const transporter = nodemailer.createTransport(transporterOptions);

      // Include the approval token in the HTML content
      // const htmlContent = `
      //   <html>
      //     <p>Dear User,</p>
      //     <p>The content has been shared after your approval.</p>

      //     <a href="http://10.10.0.105:3000/approve?id=${id}&file_type=${file_type}&action=${'approved'}">
      //       <button>Approved</button>
      //     </a>
      //     <a href="http://10.10.0.105:3000/approve?id=${id}&file_type=${file_type}&action=${'denied'}">
      //     <button>Denied</button>
      //     </a>
      //     <p>Regards,</p>
      //     <p>ACME DocHub</p>
      //   </html>`;

      let userdetailsLogin = await User.findOne({
        where: {
          email: email1,
        },
      });
      // console.log(folderName, "_________folderNmae");

      //jisko share kiya ja rha hai  { user_email }  usko check  kro ki kis teamspace ka hai agr nhi hai to assign kr do team space aur folder / file sshare kr do

      if (userdetailsLogin.dataValues.user_type === "User") {
        let userLevels = await User.findOne({
          where: {
            email: email,
          },
          attributes: ["level_1", "level_2"],
        });
        // console.log(userLevels,"_____userLevels")

        if (userLevels) {
          const emails = [];

          if (userLevels.level_1) {
            emails.push(userLevels.level_1);
          }

          if (userLevels.level_2) {
            emails.push(userLevels.level_2);
          }
          // console.log(userLevels.level_1,userLevels.level_2, "__________levels")
          for (const email of emails) {
            const htmlContent = `
          <html>
            <p style="font-family: Calibri;">Dear User,</p>
            <p style="font-family: Calibri;">The content has been shared after your approval.</p>
            <p style="font-family: Calibri;">${
              file_type ? "<strong>File</strong>" : "<strong>Folder</strong>"
            } <strong>Name:</strong> ${req.body.name}</p>
            
            <a href="${process.env.HOST_BACKEND}:${
              process.env.PORT
            }/approve?id=${
              createdDocument.id
            }&user_email=${user_email}&action=${"approved"}&workspace_name=${workspace_name}&workspace_type=${workspace_type}&email=${email}">
              <button>Approved</button>
            </a>
            <a href="${process.env.HOST_BACKEND}:${
              process.env.PORT
            }/approve?id=${
              createdDocument.id
            }&user_email=${user_email}&action=${"denied"}&workspace_name=${workspace_name}&workspace_type=${workspace_type}&email=${email}">
            <button>Denied</button>
            </a>
            <p style="font-family: Calibri;">Regards,</p>
            <img src="cid:acmeLogo" alt="acme_logo">
            <p style="font-family: Calibri;">ACME DocHub</p>
          </html>`;

            const mailOptions = {
              from: `ACME DocHub <${smtp_details.from_address}>`,
              to: email,
              subject: `- ACME DocHub - Content to approve.`,
              html: htmlContent,
              attachments: [
                {
                  filename: "acmeLogoEmail.png",
                  path: "img/acmeLogoEmail.png",
                  cid: "acmeLogo",
                },
              ],
            };
            const info = await transporter.sendMail(mailOptions);
            console.log("Daily Email sent to", email, ":", info.response);
          }

          // for (const email of emails) {
          //   const uniqueId = Math.random().toString(36).substring(7); // Generate a unique ID for each iteration

          //   const htmlContent = `
          //     <html>
          //       <head>
          //         <script>
          //           function handleButtonClick(buttonType, uniqueId) {
          //             document.getElementById('approveButton_' + uniqueId).disabled = true;
          //             document.getElementById('denyButton_' + uniqueId).disabled = true;
          //             apiRequest(buttonType, uniqueId);
          //           }

          //           function apiRequest(buttonType, uniqueId) {
          //             fetch('http://10.10.0.105:3000/approve?id=${createdDocument.id}&user_email=${user_email}&action=${buttonType}&workspace_name=${workspace_name}&workspace_type=${workspace_type}&email=${email}&uniqueId=' + uniqueId)
          //               .then(response => response.json())
          //               .then(data => {
          //                 console.log('API response:', data);
          //               })
          //               .catch(error => {
          //                 console.error('Error making API request:', error);
          //               });
          //           }
          //         </script>
          //       </head>
          //       <body>
          //         <p>Dear User,</p>
          //         <p>The content has been shared after your approval.</p>

          //         <a href="#" onclick="handleButtonClick('approved', '${uniqueId}'); return false;">
          //           <button id="approveButton_${uniqueId}">Approved</button>
          //         </a>
          //         <a href="#" onclick="handleButtonClick('denied', '${uniqueId}'); return false;">
          //           <button id="denyButton_${uniqueId}">Denied</button>
          //         </a>

          //         <p>Regards,</p>
          //         <p>ACME DocHub</p>
          //       </body>
          //     </html>`;
          //     console.log("i m inside email")

          //   const mailOptions = {
          //     from: 'ACME DocHub <noreply.dochub@acmetelepower.in>',
          //     to: email,
          //     subject: `- ACME DocHub - Content to approve.`,
          //     html: htmlContent,
          //   };

          //   const info = await transporter.sendMail(mailOptions);
          //   console.log('Daily Email sent to', email, ':', info.response);
          // }
        }
      } else {
        await Guest.update(
          {
            // shared_workspace_name:,
            is_approved1: "true",
            is_approved2: "true",
          },
          {
            where: {
              id: createdDocument.id,
            },
          }
        );
        //workspacename form body is assigned to user whith whome the file or folder has been shared

        let workSpaceCheck = await workspace.findOne({
          where: {
            workspace_name: workspace_name,
            workspace_type: "TeamSpace",
          },
        });
        if (!workSpaceCheck) {
          return res.status(404).send({
            message: `${workspace_name}  ${workspace_type} Is Not Available In Workspace Database`,
          });
        }
        if (!workSpaceCheck.selected_users.includes(user_email)) {
          const updatedSelectedUsers = [
            ...workSpaceCheck.selected_users,
            user_email,
          ];

          // Update the selected_users field
          await workspace.update(
            { selected_users: updatedSelectedUsers },
            {
              where: {
                workspace_name: workspace_name,
                workspace_type: "TeamSpace",
              },
            }
          );
        }
      }
      const loggsfolder = await Alllogs.create({
        user_id: email1,
        category: "Shared",
        action: `${storeName} has been Shared to User : ${email}`,
        timestamp: Date.now(),
        system_ip: clientIP,
      });
      return res
        .status(200)
        .json({ message: "File Sent To User Successfully" });
    }
  } catch (error) {
    console.log("Error from server:", error);
    return res.status(500).json({
      status: false,
      message: "An Error Occurred While Processing The Request",
    });
  }
});

router.get("/approve", async (req, res) => {
  const clientIP = req.clientIP;
  try {
    const { id, user_email, action, workspace_name, workspace_type } =
      req.query;
    let queryEmail = req.query.email;

    const user_details = await User.findOne({
      where: {
        email: user_email,
        [Op.or]: [{ level_1: queryEmail }, { level_2: queryEmail }],
      },
      attributes: ["level_1", "level_2"],
    });
    const { level_1, level_2 } = user_details.dataValues;
    let is_approved_column;
    if (level_1 === queryEmail) {
      is_approved_column = "is_approved1";
    } else if (level_2 === queryEmail) {
      is_approved_column = "is_approved2";
    }

    if (action === "approved" && is_approved_column) {
      let guestData = await Guest.update(
        { [is_approved_column]: "true" },
        {
          where: {
            id: id,
          },
          returning: true,
          attributes: ["id", "is_approved1", "is_approved2"],
        }
      );
      const updatedGuest = guestData[1][0];

      if (
        updatedGuest.is_approved1 === "true" ||
        updatedGuest.is_approved2 === "true"
      ) {
        return res
          .status(200)
          .send({ status: true, message: "Already Approved" });
      }
      if (
        guestData[1][0].is_approved1 === "true" &&
        guestData[1][0].is_approved2 === "true"
      ) {
        let workSpaceCheck = await workspace.findOne({
          where: {
            workspace_name: workspace_name,
            workspace_type: "TeamSpace",
          },
        });
        if (!workSpaceCheck) {
          return res.status(404).send({
            message: `${workspace_name}  ${workspace_type} Is Not Available In Workspace Database`,
          });
        }
        if (!workSpaceCheck.selected_users.includes(user_email)) {
          const updatedSelectedUsers = [
            ...workSpaceCheck.selected_users,
            user_email,
          ];

          // Update the selected_users field
          await workspace.update(
            { selected_users: updatedSelectedUsers },
            {
              where: {
                workspace_name: workspace_name,
                workspace_type: "TeamSpace",
              },
            }
          );
        }
      }

      return res
        .status(200)
        .send({ message: "Approval Processed Successfully" });
    } else if (action === "denied" && is_approved_column) {
      let guestData = await Guest.update(
        { [is_approved_column]: "denied" },
        {
          where: {
            id: id,
          },
          returning: true,
          attributes: ["id", "is_approved1", "is_approved2"],
        }
      );
      const updatedGuest = guestData[1][0];

      if (
        updatedGuest.is_approved1 === "denied" ||
        updatedGuest.is_approved2 === "denied"
      ) {
        return res
          .status(200)
          .send({ status: true, message: "Already Denied" });
      }

      return res.status(200).send({ message: "Approval Denied" });
    }
  } catch (error) {
    return res.status(500).send({ message: "Server Error" });
  }
});

router.post("/guestlogin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.clientIP;

    const guest = await Guestsignup.findOne({
      where: {
        email: email,
      },
    })
      .then((result) => {
        if (result.dataValues.user_status === "inactive") {
          return res.status(200).send({ message: "User Deactivated" });
        }
        bcrypt.compare(password, result.hash_password).then(function (Cresult) {
          if (Cresult == true) {
            const loggsfolder = Alllogs.create({
              user_id: email,
              category: "Auth",
              action: ` Guest Login`,
              timestamp: Date.now(),
              system_ip: clientIP,
            });
            res.status(200).json({
              type: "guest",
              success: true,
              message: "Guest Log in Successful",
              email: email,
              token: jwtgenerator(
                result.dataValues.id,
                result.dataValues.email
              ),
            });
          } else {
            return res
              .status(401)
              .json({ success: false, message: "User Not Authorized" });
          }
        });
      })
      .catch((err) => {
        return res
          .status(404)
          .json({ success: false, message: "Incorrect Password" });
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An Error Occurred While Processing The Request",
    });
  }
});

// Assuming you have defined the associations in your Sequelize models

// router.post('/guestdata', middleware,async (req, res) => {
//     console.log("api hits")
//     try {
//         const token = req.header("Authorization");
//         // console.log(token,"____toevsdvsdsvs")
//         const decodedToken = jwt.verify(token, 'acmedms');
//         const  email = decodedToken.user.username
//         console.log(email,"____email")
//       const guest = await Guest.findOne({ where: { guest_email: email } }); // Use findOne instead of findAll
//   const id = guest.file_id;
//   console.log(id,"____idid")
//       if (guest) {
//         const files = await FileUpload.findAll({ where:{
//     id:id
//         },
//           attributes: ["id", "file_name", "file_type", "file_size", "updatedAt"]
//         });
//         console.log(files, "_____-files");
//         return res.status(200).json({ success: true, guest, files ,type:"guest"}); // Combine guest and files data
//       } else {
//         return res.status(401).json({ success: false, message: "This email does not exist" });
//       }
//     } catch (error) {
//       return res.status(500).json({ success: false, message: "Server error" });
//     }
//   });

// router.post('/guestdata',middleware, async (req, res) => {
//working but displaying file above the folder
//   try {
//       const token = req.header("Authorization");
//       const decodedToken = jwt.verify(token, 'acmedms');
//       const  email = decodedToken.user.username
//       let {levels, id , parent_id,workspace_name,workspace_id} = req. body;
//       const guests = await Guest.findAll({
//         where: {
//           guest_email: email
//         },
//         attributes: { exclude: ['id'] }
//       });

//       levels = parseInt(levels);
//       parent_id = parseInt(parent_id);
//       // const guestsWithFileInfo = [];
//       let response_folder = []
//       let response_file = []

//       if ((levels === 0 || !isNaN(levels)) && (parent_id === 0 || !isNaN(parent_id))) {
//         const folder_name = await Folder.findOne({
//           where: {
//             // id:id,
//             levels:levels,
//             parent_id: parent_id,
//             // workspace_name: workspace_name,
//             // workspace_id : workspace_id
//           },
//           // attributes: [
//           //   'parent_id','levels','folder_name',  'workspace_name','workspace_id', 'time_stamp',   'is_recycle',
//           // ]
//         });
//       // if (folder_name === null) {
//       //   return res.json( [] );
//       // }
//       console.log(folder_name,"______________folder_name")
//       if (!folder_name) {
//         return res.json({ response_folder: [], response_file: [] });
//       }
//       const folders = await Folder.findAll({
//                   where:{
//                     levels : levels,
//                     parent_id: id,
//                     // workspace_id: workspace_id,
//                     // workspace_name: workspace_name,
//                     is_recycle:"false"
//                   }
//                 })

//       const guest_data = await Guest.findOne({
//         where: {
//           guest_email: email,
//         },
//       });
//       folders.forEach((folder) => {
//         const shared_by = guest_data.shared_by;
//         folder.dataValues.shared_by = shared_by;
//         const shared_with = guest_data.guest_email;
//         folder.dataValues.shared_with = shared_with;
//         // guestsWithFileInfo.push(folder);
//         if (folder) {
//           response_folder.push(folder);
//         }
//       });
//       const files = await FileUpload.findAll({
//         where: {
//           folder_name: folder_name.folder_name,
//           // workspace_name: workspace_name,
//           is_recyclebin: "false",
//         },
//         attributes: [
//           "id",
//           "user_id",
//           "file_name",
//           "file_type",
//           "file_size",
//           "updatedAt",
//           "filemongo_id",
//           "user_type",
//         ],
//       });
//       files.forEach((file) => {
//         const shared_by = guest_data.shared_by;
//         file.dataValues.shared_by = shared_by;
//         const shared_with = guest_data.guest_email;
//         file.dataValues.shared_with = shared_with;
//         // guestsWithFileInfo.push(file);
//         if(file){
//           response_file.push(file);
//         }

//       });
//       const folderFiles = files.filter((file) => file.folder_name === folder_name.folder_name);
//       return res.status(200).json({ response_folder: response_folder, response_file: folderFiles });
//     }else{

//     for (const guest of guests) {
//       let fileInfo;
//       if (guest.file_id && guest.folder_id === null) {
//         fileInfo = await FileUpload.findOne({ where: { id: guest.file_id, is_recyclebin: "false" } });
//         if (!fileInfo) {
//           // return res.status(404).json({ response_file: [] });
//           fileInfo= null
//         }else{

//           fileInfo.dataValues.shared_by = guest.shared_by;
//           fileInfo.dataValues.shared_with = guest.guest_email;
//           fileInfo.dataValues.expiry_date = guest.expiry_date;
//           // guestsWithFileInfo.push(fileInfo)
//         }
//         response_file.push(fileInfo)

//       } else {
//         fileInfo = await Folder.findOne({ where: { id: guest.folder_id, is_recycle: "false" } });
//         if (!fileInfo) {
//           // return res.status(404).json({ response_folder: [] });
//           fileInfo = null
//         }
//         else{

//           fileInfo.dataValues.shared_by = guest.shared_by;
//           fileInfo.dataValues.shared_with = guest.guest_email;
//           fileInfo.dataValues.expiry_date = guest.expiry_date;
//           // guestsWithFileInfo.push(fileInfo)
//         }
//         response_folder.push(fileInfo)

//       }

//     }
//     response_folder = response_folder.filter((folder) => folder !== null);
//     response_file = response_file.filter((file) => file !== null);

//    // return res.status(200).json({response_folder,response_file});
//   //  return res.status(200).json({response_folder,response_file});
//    return res.status(200).json({ response_folder: response_folder, response_file: response_file });
//   }
//    // Remove null or empty objects from the arrays

// } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Server Error" });
//   }
// });

// router.post('/guestdata', async (req,res)=>{
//   //2nd made by Aman
//   try {
//     const token = req.header("Authorization");
//     const decodedToken = jwt.verify(token,"acmedms")
//     let guest_email = decodedToken.user.username
//     console.log(guest_email,"____________guestEmail")
//     let {levels, id , parent_id,workspace_name,workspace_id} = req. body;
//     // let guestData = await Guest.findAll({
//     //   where:{guest_email:guest_email}
//     // })
//     // if(guestData.length ==0){
//     //   return res.status(404).send({response_folder:[]})
//     // }
//     levels = parseInt(levels);
//       parent_id = parseInt(parent_id);
//       // const guestsWithFileInfo = [];
//       // let response_folder = []
//       // let response_file = []
//       async function fetchFilesAndFolders(dataArray) {
//         const response_folder = [];
//         const response_file = [];

//         for (const item of dataArray) {
//           console.log(item.dataValues,"__________items.datavalue")
//           if (item.dataValues.file_id) {
//             // If it's a file, fetch the file details
//             const fileDetails = await FileUpload.findOne({
//               where: { id: item.dataValues.file_id, is_recyclebin: "false" },
//               attributes: [
//                 "id",
//                 "user_id",
//                 "file_name",
//                 "file_type",
//                 "file_size",
//                 "updatedAt",
//                 "filemongo_id",
//                 "user_type",
//               ],
//             });
//             if (fileDetails) {
//               response_file.push(fileDetails);
//             }
//           } else if (item.folder_id) {
//             // If it's a folder, fetch all folders inside it recursively
//             const nestedFolders = await Folder.findAll({
//               where: { parent_id: item.dataValues.folder_id,levels: levels, is_recycle: "false" },
//               // Add any other attributes you need for folders
//             });

//             // Recursively call the function for nested folders
//             const nestedResults = await fetchFilesAndFolders(nestedFolders);
//             response_folder.push(...nestedResults);
//           }
//         }

//         return { response_folder, response_file };
//       }

//       // Usage example
//       const guestData = await Guest.findAll({
//         where: { guest_email: guest_email },
//       });

//       const { response_folder, response_file } = await fetchFilesAndFolders(guestData);

//       // If response_folder and response_file are empty arrays, you can check their length
//       if (response_folder.length === 0 && response_file.length === 0) {
//         // Handle the case where there are no files or folders
//         return res.status(404).send({response_folder : [], response_file: []})
//       }

//   } catch (error) {
//     return res.status(500).send({message:error.message})
//   }
// })

router.post("/guestdata", middleware, async (req, res) => {
  try {
    let { workspace_name, workspace_id, levels, id, parent_id } = req.body;
    console.log(req.body,"__reqBody")
    parent_id = parseInt(parent_id);
    levels = parseInt(levels);

    const guest_data = await Guest.findAll({
      where: { guest_email: req.decodedToken.user.username },
    });
    async function FolderAndFilesSize(folders) {
      async function calculateFolderSize(folder, totalSize) {
        const files = await FileUpload.findAll({
          where: {
            is_recyclebin: "false",
            folder_id: folder.id,
          },
        });

        for (const file of files) {
          totalSize += parseInt(file.file_size);
        }

        const childFolders = await Folder.findAll({
          where: {
            is_recycle: "false",
            parent_id: folder.id,
          },
        });

        for (const childFolder of childFolders) {
          totalSize = await calculateFolderSize(childFolder, totalSize);
        }

        folder.dataValues.folder_size = totalSize;
        return totalSize;
      }

      for (let folder of folders) {
        let totalSize = 0;
        totalSize = await calculateFolderSize(folder, totalSize);
      }
    }

    let response_folder = [];
    let response_file = [];

    if (parent_id && levels) {
      const folder_name = await Folder.findOne({
        where: {
          id: parent_id,
        },
        attributes: ["folder_name", "id"],
      });
      const folders = await Folder.findAll({
        where: {
          levels: levels,
          // folder_name: folder_name,
          parent_id: parent_id,
          is_recycle: "false",
        },
      });
      const files = await FileUpload.findAll({
        where: {
          folder_id: folder_name.id,
          is_recyclebin: "false",
        },
        attributes: [
          "id",
          "user_id",
          "file_name",
          "file_type",
          "file_size",
          "updatedAt",
          "filemongo_id",
          "user_type",
          "workspace_name",
        ],
      });

      let sharedEmail = await Guest.findOne({
        where: {
          guest_email: req.decodedToken.user.username,
        },
      });
      // Apply the function to folders
      folders.forEach((folder) => {
        folder.dataValues.shared_by = sharedEmail.shared_by;
      });
      files.forEach((file) => {
        file.dataValues.shared_by = sharedEmail.shared_by;
      });
      await FolderAndFilesSize(folders);

      return res
        .status(200)
        .json({ response_folder: folders, response_file: files });
    } else {
      for (const guest of guest_data) {
        let fileInfo;
        if (guest.file_id && guest.folder_id === null) {
          fileInfo = await FileUpload.findOne({
            where: { id: guest.file_id, is_recyclebin: "false" },
          });
          if (!fileInfo) {
            fileInfo = null;
          } else {
            fileInfo.dataValues.shared_by = guest.shared_by;
            fileInfo.dataValues.shared_with = guest.guest_email;
            fileInfo.dataValues.expiry_date = guest.expiry_date;
            fileInfo.dataValues.share = guest.share;
            fileInfo.dataValues.rename = guest.rename;
            fileInfo.dataValues.move = guest.move;
            fileInfo.dataValues.rights = guest.rights;
            fileInfo.dataValues.comment = guest.comment;
            fileInfo.dataValues.properties = guest.properties;
            fileInfo.dataValues.delete_action = guest.delete_action;
            fileInfo.dataValues.download = guest.download;
            fileInfo.dataValues.view = guest.view;
            fileInfo.dataValues.create_folder = guest.create_folder;
            fileInfo.dataValues.upload_file = guest.upload_file;
            fileInfo.dataValues.upload_folder = guest.upload_folder;
            // guestsWithFileInfo.push(fileInfo)
          }
          response_file.push(fileInfo);
        } else {
          fileInfo = await Folder.findOne({
            where: { id: guest.folder_id, is_recycle: "false" },
          });
          if (!fileInfo) {
            // return res.status(404).json({ response_folder: [] });
            fileInfo = null;
          } else {
            fileInfo.dataValues.shared_by = guest.shared_by;
            fileInfo.dataValues.shared_with = guest.guest_email;
            fileInfo.dataValues.expiry_date = guest.expiry_date;
            fileInfo.dataValues.share = guest.share;
            fileInfo.dataValues.rename = guest.rename;
            fileInfo.dataValues.move = guest.move;
            fileInfo.dataValues.rights = guest.rights;
            fileInfo.dataValues.comment = guest.comment;
            fileInfo.dataValues.properties = guest.properties;
            fileInfo.dataValues.delete_action = guest.delete_action;
            fileInfo.dataValues.download = guest.download;
            fileInfo.dataValues.view = guest.view;
            fileInfo.dataValues.create_folder = guest.create_folder;
            fileInfo.dataValues.upload_file = guest.upload_file;
            fileInfo.dataValues.upload_folder = guest.upload_folder;
          }
          response_folder.push(fileInfo);
        }
      }
      await FolderAndFilesSize(response_folder);

      // response_folder = response_folder.filter((folder) => folder !== null);
      // response_file = response_file.filter((file) => file !== null);
      // console.log(response_folder,"response_file")

      const currentTimestamp = Date.now();

      response_folder = response_folder.filter((folder) => {
        if (folder === null) {
          // Keep null items in the array
          return true;
        }

        if (!folder.dataValues.expiry_date) {
          // Keep items with null expiry_date
          return true;
        }

        // Convert expiry_date to a Date object
        const expiryDate = new Date(folder.dataValues.expiry_date);

        // Check if expiry_date is in the future (not crossed)
        return expiryDate.getTime() > currentTimestamp;
      });
      // console.log(response_folder,"______response_folder")

      response_file = response_file.filter((file) => {
        if (file === null) {
          // Keep null items in the array
          return true;
        }

        if (!file.dataValues.expiry_date) {
          // Keep items with null expiry_date
          return true;
        }

        // Convert expiry_date to a Date object
        const expiryDate = new Date(file.dataValues.expiry_date);

        // Check if expiry_date is in the future (not crossed)
        return expiryDate.getTime() > currentTimestamp;
      });

      return res.status(200).json({
        response_folder: response_folder,
        response_file: response_file,
      });
    }
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error retrieving folder names:", error);
    return res
      .status(500)
      .json({ message: "An Error Occurred While Retrieving Folder Names" });
  }
});

router.post("/adminteamspace", async (req, res) => {
  try {
    // const token = req.header("Authorization");
    // console.log(token,"____toevsdvsdsvs")
    // const decodedToken = jwt.verify(token, 'acmedms');
    // const email = "sunilrana@gmail.com"
    const workspace_name = req.body.workspace_name;
    const userr = await workspace.findOne({
      where: {
        workspace_name: workspace_name,
      },
    });
    // const  email = decodedToken.user.username
    const user_id = userr.user_id;
    const user = await User.findOne({ where: { id: user_id } });
    // const user_type = user.user_type
    // console.log(user_type,"____usertype")

    const guests = await Guest.findAll({
      where: {
        shared_by: user.email,
      },
    });
    const guestsWithFileInfo = await Promise.all(
      guests.map(async (guest) => {
        const fileUpload = await FileUpload.findOne({
          where: { id: guest.file_id, is_recyclebin: "false" },
        });
        const { file_name, filemongo_id, file_size } = fileUpload;
        return Object.assign({}, guest.toJSON(), {
          file_name,
          filemongo_id,
          file_size,
        });
      })
    );

    // Return the modified guests object with file_name and file_size
    res.json(guestsWithFileInfo);
    //   else{
    //       console.log("inside Admin___________")
    //       const guests = await Guest.findAll();
    // const guestsWithFileInfo = await Promise.all(guests.map(async (guest) => {
    //   const fileUpload = await FileUpload.findOne({ where: { id: guest.file_id } });
    //   if (fileUpload) {
    //     const { file_name, file_size } = fileUpload;
    //     return Object.assign({}, guest.toJSON(), { file_name, file_size });
    //   } else {
    //     return guest.toJSON();
    //   }
    // }));

    // return res.status(200).json({ success: true, guestsWithFileInfo });
    //   }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.post('/guesteamspace', async (req, res) => {
//   console.log("first");
//   try {
//     const token = req.header('Authorization');
//     // const email = token.user.username;
//     const email = "test43@gmail.com";
//     const guests = await Guest.findAll();

//     const guestsWithFileInfo = await Promise.all(guests.map(async (guest) => {
//       const fileUpload = await FileUpload.findOne({ where: { id: guest.file_id } });
//       if (fileUpload) {
//         const { file_name, file_size } = fileUpload;
//         return Object.assign({}, guest.toJSON(), { file_name, file_size });
//       } else {
//         return guest.toJSON();
//       }
//     }));

//     return res.status(200).json({ success: true, guestsWithFileInfo });

//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ message: "server error", success: false });
//   }
// });

module.exports = router;
