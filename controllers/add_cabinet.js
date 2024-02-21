const Cabinet = require('../models/add_cabinet')
const fs = require('fs');
const path = require('path');
const base64 = require('base-64');
const iconv = require('iconv-lite');
exports.add_cabinet = async (req, res) =>{
  try {
    const { cabinet_name, selected_groups, selected_users, id } = req.body;
    // const cabinetPath = path.join(path_name, 'ACMECMS', cabinet_name);
    // const pathBytes = Buffer.from(cabinetPath, 'utf-8');
    // const base64EncodedPath = base64.encode(pathBytes);
    let cabinet;
    if (id){
      cabinet = await Cabinet.findOne({ where: { id: id } });
      if (!cabinet) {
        return res.status(404).json({
          message: 'Cabinet Not Found'
        });
      }
      await Cabinet.update({
          cabinet_name: cabinet_name,
          selected_groups: Array.isArray(selected_groups) ? selected_groups : [selected_groups],
          selected_users: Array.isArray(selected_users) ? selected_users : [selected_users]
        },
        { where: { id: id } }
      );
    } else {
      // Create a new cabinet
      const existingCabinet = await Cabinet.findOne({
        where: { cabinet_name: cabinet_name }
      });
      if (existingCabinet) {
        return res.status(409).json({
          message: 'Cabinet Name Already Exists'
        });
      }
      // if (!fs.existsSync(cabinetPath)) {
      //   fs.mkdirSync(cabinetPath, { recursive: true });
      // }
      cabinet = await Cabinet.create({
        cabinet_name: cabinet_name,
        selected_groups: Array.isArray(selected_groups) ? selected_groups : [selected_groups],
        selected_users: Array.isArray(selected_users) ? selected_users : [selected_users]
      });
    }
    return res.status(id ? 200 : 201).json({
      message: `Cabinet ${id ? 'Updated' : 'Created'} Successfully`,
      cabinet: cabinet
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `Error ${id ? 'updating' : 'creating'} cabinet: ${error.message || 'Unknown error'}`
    });
  }
};


exports.deletecabinet=async(req,res)=>{
    try {
      const { id } = req.body;
  
      const cabinet = await Cabinet.findOne({ where: { id: id } });
      if (!cabinet) {
        return res.status(404).json({
          message: 'Cabinet Not Found'
        });
      }
  
      await Cabinet.destroy({ where: { id: id } });
  
      return res.status(200).json({
        message: 'Cabinet Deleted Successfully'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error Deleting Cabinet'
      });
    }
  };
  


  exports.cabinet_dropdown = async (req, res) => {
    try {
      const data = await Cabinet.findAll();
      // // Modify select_cabinet column to base64-encoded path
      // data.forEach((row) => {
      //   const decodedData = iconv.decode(Buffer.from(row.path, 'base64'), 'win1252');
      //   const normalForm = decodedData.replace(/\\/g, '\\');
      //   // console.log(normalForm, "__");
      //   row.path = normalForm;
      // });
      // if(data.length == 0){
      //   return res.status(200).send({message:"No Cabinate found"})
      // }
      return res.status(200).json({ message: "Success", data});
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  
  exports.get_cabinet = async (req, res) => {
    try {
      let all_cabinets = await Cabinet.findAll({
        order: [['createdAt', 'DESC']],
      });
  
      let response = {
        data: all_cabinets,
        count: all_cabinets.length,
      };
  
      return res.status(200).send({ status: true, response });
    } catch (error) {
      return res.status(500).send({ message: "Server Error" });
    }
  };
  
  