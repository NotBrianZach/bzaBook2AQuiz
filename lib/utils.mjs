import fs from "fs";
export default {
  validateObj: function(object, key, values) {
    if (object[key] && values.includes(object[key])) {
      return true;
    }
    return false;
  },
  parseJSONFromFileOrReturnObjectSync: function(filepath) {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath), {
        encoding: "utf8",
        flag: "r"
      });
    } else {
      return {};
    }
  }
};
