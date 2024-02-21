const express = require("express");
const router = express.Router();
const Policy = require("../models/policies/policy");
const Permission = require("../models/permission");
const middleware = require("../middleware/authorization");
const loggs = require("../models/logsdetails/alllogs");
const { Op } = require("sequelize");
// router.post('/addpolicies',async(req,res)=>{
// try {
//   console.log(req.body,"______polices")

//  const {policy_name,selected_user,selected_group,policy_type,minimum_characters,minimum_numeric,minimum_alphabet,
//   minimum_special,incorrect_password,minimum_days,maximum_days,subject,
//   message,minimum_upload,maximum_download,view,share,rename,
//   upload_folder,create_folder,upload_file, file_extension} = req.body
//   const delete_per = req.body.delete
//   const download_per = req.body.download

//   const mini_maxi_bandwidth = [minimum_upload,maximum_download]
//   const mini_maxi_days = [minimum_days,maximum_days]
//    const policies = await Policy.create({
//     policy_name:policy_name,
//     selected_users:selected_user,
//     selected_group:selected_group,
//     policy_type:policy_type,
//     minimum_character:minimum_characters,
//     minimum_numeric:minimum_numeric,
//     minimum_Alphabets:minimum_alphabet,
//     minimum_special_character:minimum_special,
//     inncorrect_password_attend:incorrect_password,
//    subject:subject,
//    message:message,
//    view:view,
//    share:share,
//    rename:rename,
//    upload_folder:upload_folder,
//    create_folder:create_folder,
//    upload_file:upload_file,
//    delete_per:delete_per,
//    download_per:download_per,
//    Bandwidth_min_max:mini_maxi_bandwidth,
//    minimum_maximum_days:mini_maxi_days,
//    properties_name: file_extension
//    })
//    return res.status(200).json({message:" policy created sucessfully",policies})
// } catch (error) {
//   console.log(error)
//  return res.status(500).json({message:"server error"})
// }
// })

router.post("/addpolicies", middleware, async (req, res) => {
  try {
    // const alreadyper = await Policy.finOne({where:{
    //   selected_users: {
    //     [Op.contains]: array of emails
    //   }
    // }})
    let {
      id,
      policy_name,
      selected_user,
      selected_group,
      policy_type,
      minimum_characters,
      minimum_numeric,
      minimum_alphabet,
      minimum_special,
      incorrect_password,
      minimum_days,
      maximum_days,
      subject,
      message,
      minimum_upload,
      minimum_download,
      view,
      share,
      rename,
      upload_folder,
      create_folder,
      upload_file,
      file_extension,
      move,
      properties,
      comment,
      rights,
      recycle_bin,
      no_of_days,
      versions,
      no_of_versions,
    } = req.body;
    const delete_per = req.body.delete;
    const download_per = req.body.download;
    const mini_maxi_bandwidth = [minimum_upload, minimum_download];
    const mini_maxi_days = [minimum_days, maximum_days];

    let policy;

    // const currentTimestamp = Date.now();
    // const no_of_days_LaterTimestamp = currentTimestamp + parseInt(no_of_days) * 24 * 60 * 60 * 1000;

    // no_of_days = no_of_days_LaterTimestamp

    if (id) {
      // If id is provided, update the existing policy
      policy = await Policy.findByPk(id);
      if (!policy) {
        return res.status(404).json({ message: "Policy Not Found" });
      }

      policy.policy_name = policy_name;
      policy.selected_users = selected_user;
      policy.selected_group = selected_group;
      policy.policy_type = policy_type;
      policy.minimum_character = minimum_characters;
      policy.minimum_numeric = minimum_numeric;
      policy.minimum_Alphabets = minimum_alphabet;
      policy.minimum_special_character = minimum_special;
      policy.inncorrect_password_attend = incorrect_password;
      policy.subject = subject;
      policy.message = message;
      policy.view = view;
      policy.share = share;
      policy.rename = rename;
      policy.upload_folder = upload_folder;
      policy.create_folder = create_folder;
      policy.upload_file = upload_file;
      policy.delete_per = delete_per;
      policy.download_per = download_per;
      policy.Bandwidth_min_max = mini_maxi_bandwidth;
      policy.minimum_maximum_days = mini_maxi_days;
      policy.properties_name = file_extension;
      policy.move = move;
      policy.properties = properties;
      policy.comments = comment;
      policy.rights = rights;
      (policy.recycle_bin = recycle_bin), (policy.no_of_days = no_of_days);
      (policy.versions = versions), (policy.no_of_versions = no_of_versions);
      await policy.save();
    } else {
      // If id is not provided, create a new policy
      policy = await Policy.create({
        policy_name: policy_name,
        selected_users: selected_user,
        selected_group: selected_group,
        policy_type: policy_type,
        minimum_character: minimum_characters,
        minimum_numeric: minimum_numeric,
        minimum_Alphabets: minimum_alphabet,
        minimum_special_character: minimum_special,
        inncorrect_password_attend: incorrect_password,
        subject: subject,
        message: message,

        view: view,
        share: share,
        rename: rename,
        upload_folder: upload_folder,
        create_folder: create_folder,
        upload_file: upload_file,
        delete_per: delete_per,
        download_per: download_per,
        Bandwidth_min_max: mini_maxi_bandwidth,
        minimum_maximum_days: mini_maxi_days,
        properties_name: file_extension,
        move: move,
        properties: properties,
        comments: comment,
        rights: rights,
        recycle_bin: recycle_bin,
        no_of_days: no_of_days,
        versions: versions,
        no_of_versions: no_of_versions,
      });
    }

    return res.status(200).json({
      message: `Policy ${id ? "Updated" : "Created"} Successfully`,
      policy,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

function calculateDaysLeft(timestamp) {
  timestamp = parseInt(timestamp);
  const targetDate = new Date(timestamp);
  const currentDate = new Date();
  const timeDifference = targetDate - currentDate;
  const daysLeft = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  return daysLeft;
}

router.post("/getpolicy", middleware, async (req, res) => {
  try {
    const data2 = await Policy.findAll({
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ message: "Success", data2 });
  } catch (error) {
    console.log(error);
  }
});

router.post("/deletepolicy", middleware, async (req, res) => {
  try {
    const id = req.body.id;
    await Policy.destroy({ where: { id: id } });
    return res.status(200).json({ message: "Policy Delete Successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post("/add_permission", middleware, async (req, res) => {
  try {
    let {
      id,
      folder_id,
      file_id,
      policy_type,
      selected_users,
      selected_group,
      properties,
      download_per,
      delete_per,
      view,
      create_folder,
      upload_file,
      upload_folder,
      share,
      rename,
      move,
      rights,
      comments,
      workspace_id,
      folder_name,
      file_name,
      workspace_name,
    } = req.body;
    const email = req.decodedToken.user.username;
    const clientIP = req.clientIP;
    let rightsToStoreInAction = "";

    if (view) {
      rightsToStoreInAction += "View, ";
    }
    if (download_per) {
      rightsToStoreInAction += "Download, ";
    }
    if (delete_per) {
      rightsToStoreInAction += "Delete, ";
    }
    if (create_folder) {
      rightsToStoreInAction += "Create Folder, ";
    }
    if (upload_file) {
      rightsToStoreInAction += "Upload File, ";
    }
    if (upload_folder) {
      rightsToStoreInAction += "Upload Folder, ";
    }
    if (share) {
      rightsToStoreInAction += "Share, ";
    }
    if (rename) {
      rightsToStoreInAction += "Rename, ";
    }
    if (move) {
      rightsToStoreInAction += "Move, ";
    }
    if (rights) {
      rightsToStoreInAction += "Rights, ";
    }
    if (comments) {
      rightsToStoreInAction += "Comment, ";
    }
    rightsToStoreInAction = rightsToStoreInAction.trim().replace(/,$/, "");

    if (!folder_id && !file_id && !workspace_id) {
      return res.status(400).send({
        status: false,
        message: "Folder_id | file_id | workspace_id any one is required",
      });
    }
    if ((folder_id || file_id) && selected_users.length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please Select Users" });
    }
    if (!policy_type) {
      return res
        .status(400)
        .send({ status: false, message: "Send Me policy_type" });
    }
    let permission;

    if (id) {
      permission = await Permission.findByPk(id);
      if (!permission) {
        return res
          .status(404)
          .send({ status: false, message: "Permission Not Found" });
      }
      permission.folder_id = folder_id || null;
      permission.file_id = file_id || null;
      permission.workspace_id = workspace_id || null;
      permission.policy_type = policy_type;
      permission.selected_users = selected_users;
      permission.selected_group = selected_group;
      permission.properties = properties;
      permission.download_per = download_per;
      permission.delete_per = delete_per;
      permission.view = view;
      permission.create_folder = create_folder;
      permission.upload_file = upload_file;
      permission.upload_folder = upload_folder;
      permission.share = share;
      permission.rename = rename;
      permission.move = move;
      permission.rights = rights;
      permission.comments = comments;

      await permission.save();
      if (workspace_id && (!folder_id || !file_id)) {
        await loggs.create({
          user_id: email,
          category: "Permission",
          action: `Permission Updated For Workspace : ${workspace_name}`,
          timestamp: Date.now(),
          system_ip: clientIP,
          workspace_id: workspace_id,
        });
      } else if (folder_id || file_id) {
        const targetType = folder_id ? "Folder" : "File";
        const targetName = folder_id ? folder_name : file_name;

        await loggs.create({
          user_id: email,
          category: "Permission",
          action: `Permission Updated For ${targetType} : ${targetName}, Users: ${selected_users.join()}, Rights: ${rightsToStoreInAction}`,
          timestamp: Date.now(),
          file_id: file_id || null,
          folder_id: folder_id || null,
          system_ip: clientIP,
        });
      }
    } else {
      permission = await Permission.create({
        folder_id: folder_id || null,
        file_id: file_id || null,
        workspace_id: workspace_id || null,
        policy_type: policy_type,
        selected_users: selected_users,
        selected_group: selected_group,
        properties: properties,
        download_per: download_per,
        delete_per: delete_per,
        view: view,
        create_folder: create_folder,
        upload_file: upload_file,
        upload_folder: upload_folder,
        share: share,
        rename: rename,
        move: move,
        rights: rights,
        comments: comments,
      });
      if (workspace_id && (!folder_id || !file_id)) {
        await loggs.create({
          user_id: email,
          category: "Permission",
          action: `Permission Created For Workspace : ${workspace_name}`,
          timestamp: Date.now(),
          system_ip: clientIP,
          workspace_id: workspace_id,
        });
      } else if (folder_id || file_id) {
        const targetType = folder_id ? "Folder" : "File";
        const targetName = folder_id ? folder_name : file_name;
        await loggs.create({
          user_id: email,
          category: "Permission",
          action: `Permission Created For ${targetType} : ${targetName}, Users: ${selected_users.join()}, Rights: ${rightsToStoreInAction}`,
          timestamp: Date.now(),
          file_id: file_id || null,
          folder_id: folder_id || null,
          system_ip: clientIP,
        });
      }
    }
    return res.status(id ? 200 : 201).send({
      status: true,
      message: `Permission ${id ? "Updated" : "Created"} Sucessfully`,
      permission,
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
});

router.post("/get_workspace_permission", middleware, async (req, res) => {
  try {
    let { folder_id, email, file_id } = req.body;

    if (!folder_id && !file_id) {
      return res
        .status(400)
        .send({ status: false, message: "folder_id or file_id is mandatory" });
    }

    if (!Array.isArray(email)) {
      return res
        .status(400)
        .send({ status: false, message: "Email should be in an array" });
    }
    if (folder_id || file_id) {
      let whereClause = {
        selected_users: {
          [Op.contains]: email,
        },
      };

      if (folder_id) {
        whereClause.folder_id = folder_id;
      }

      if (file_id) {
        whereClause.file_id = file_id;
      }

      let workspace_permissions = await Permission.findOne({
        where: whereClause,
        raw: true,
      });
      const responsePayload = {
        status: true,
        workspace_permissions: workspace_permissions || {},
      };

      return res.status(200).send(responsePayload);
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Invalid folder_id or file_id value" });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
});

module.exports = router;
