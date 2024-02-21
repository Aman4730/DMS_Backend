const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const right = sequelize.define("permission", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  folder_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  file_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  workspace_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  policy_type: {
    type: Sequelize.STRING,
    allowedNull: false,
  },
  selected_users: {
    type: Sequelize.JSONB,
    allowNull: true,
  },
  selected_group: {
    type: Sequelize.JSONB,
    allowNull: true,
  },
  properties: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  download_per: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  delete_per: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  view: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  create_folder: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  upload_file: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  upload_folder: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  share: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  rename: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  move: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  rights: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  comments: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
});

module.exports = right;
