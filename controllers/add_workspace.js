const Worksapce = require("../models/add_workspace");
const fs = require("fs");
const path = require("path");
const base64 = require("base64-js");
const User = require("../models/add_user");
// const base64String = "RDpcQUNNRUNNU1xDMzQ=";
// const decodedString = Buffer.from(base64String, 'base64').toString('utf-8');
// console.log(decodedString);
const FileUpload = require("../models/fileupload");
const folder = require("../models/folder");
const Permission = require("../models/permission");
const { Op, Sequelize } = require("sequelize");

exports.add_workspace = async (req, res) => {
  try {
    let {
      workspace_name,
      selected_users,
      selected_groups,
      selected_cabinet,
      id,
      workspace_type,
      enter_quota,
    } = req.body;
    // const decodedString = Buffer.from(selected_cabinet, 'base64').toString('utf-8');
    const enter_quota1 = enter_quota * 1024 * 1024;
    if (selected_users.length <= 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please Select User" });
    }
    const userid = await User.findOne({
      where: {
        email: selected_users[0],
      },
    });
    if (!userid) {
      return res.status(404).send({ status: false, message: "User Not Found" });
    }
    let workspace;

    if (id) {
      workspace = await Worksapce.findOne({ where: { id: id } });
      if (!workspace) {
        return res.status(404).json({
          message: "Workspace Not Found",
        });
      }
      await FileUpload.update(
        { workspace_name: workspace_name },
        { where: { workspace_id: id } }
      );

      // Update workspace name in Folder model
      await folder.update(
        { workspace_name: workspace_name },
        { where: { workspace_id: id } }
      );
      await Worksapce.update(
        {
          workspace_name: workspace_name,
          selected_users: Array.isArray(selected_users)
            ? selected_users
            : [selected_users],
          selected_groups: Array.isArray(selected_groups)
            ? selected_groups
            : [selected_groups],
          selected_cabinet: selected_cabinet,
          workspace_type: workspace_type,
          quota: enter_quota1,
          user_id: userid.id,
        },
        { where: { id: id } }
      );
    } else {
      const existingWorkspace = await Worksapce.findOne({
        where: { workspace_name: workspace_name },
      });

      if (existingWorkspace) {
        return res.status(409).json({
          message: "Workspace Name Already Exists",
        });
      }
      workspace = await Worksapce.create({
        workspace_name: workspace_name,
        selected_users: Array.isArray(selected_users)
          ? selected_users
          : [selected_users],
        selected_groups: Array.isArray(selected_groups)
          ? selected_groups
          : [selected_groups],
        selected_cabinet: selected_cabinet,
        workspace_type: workspace_type,
        quota: enter_quota1,
        user_id: userid.id,
      });
    }
    return res.status(id ? 200 : 201).json({
      message: `Workspace ${id ? "Updated" : "Created"} Successfully`,
      workspace: workspace,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `Error ${id ? "Updated" : "Created"} Workspace`,
    });
  }
};

//
exports.deleteworksapce = async (req, res) => {
  try {
    const { id } = req.body;
    const cabinet = await Worksapce.findOne({ where: { id: id } });
    if (!cabinet) {
      return res.status(404).json({
        message: "Workspace Not Found",
      });
    }
    await Worksapce.destroy({ where: { id: id } });
    return res.status(200).json({
      message: "Workspace Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error Deleting Workspace",
    });
  }
};

// get workspace with pagi....
exports.get_workspace = async (req, res) => {
 try {
   
 
   const user_id = req.decodedToken.user.id;
   let user_details = await User.findOne({
     where: {
       id: user_id,
     },
     raw: true,
   });
   if (user_details.user_type === "User") {
     const user_workspace = await Worksapce.findAll({
       where: {
         selected_users: {
           [Op.contains]: [user_details.email],
         },
       },
       raw: true,
     });
 
     const updatedUserWorkspace = await Promise.all(
       user_workspace.map(async (workspace) => {
         const permission_details = await Permission.findOne({
           where: {
             workspace_id: workspace.id,
           },
           raw: true,
           order: [["createdAt", "DESC"]],
         });
 
         const userWorkspaceWithPermissions = {
           ...workspace,
           workspacePermission: filterNullValues(permission_details),
         };
         return userWorkspaceWithPermissions;
       })
     );
 
     function filterNullValues(obj) {
       return Object.fromEntries(
         Object.entries(obj || {}).filter(([key, value]) => value !== null)
       );
     }
 
     Promise.all(updatedUserWorkspace)
       .then((result) => {
         return res.json({ data: result });
       })
       .catch((error) => {
         console.error("Error:", error);
         return res.status(500).json({ error: error.message });
       });
   } else {
     let workspace_data = await Worksapce.findAll({
       raw: true,
       order: [["createdAt", "DESC"]],
     });
 
     const updatedUserWorkspace = await Promise.all(
       workspace_data.map(async (workspace) => {
         const permission_details = await Permission.findOne({
           where: {
             workspace_id: workspace.id,
           },
           raw: true,
         });
 
         const userWorkspaceWithPermissions = {
           ...workspace,
           workspacePermission: filterNullValues(permission_details),
         };
         return userWorkspaceWithPermissions;
       })
     );
 
     function filterNullValues(obj) {
       return Object.fromEntries(
         Object.entries(obj || {}).filter(([key, value]) => value !== null)
       );
     }
 
     Promise.all(updatedUserWorkspace)
       .then((result) => {
         return res.json({ data: result });
       })
       .catch((error) => {
         console.error("Error:", error);
         return res.status(500).json({ error: error.message });
       });
   }
 } catch (error) {
  console.log("Error",error.message)
  return res.status(500).send({status:false, message:"Server Error"})
 }
};
