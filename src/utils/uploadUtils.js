const generateFileUrl = (req, filePath) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}${filePath}`;
  };
  
  module.exports = {
    generateFileUrl
  };