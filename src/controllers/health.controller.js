const getHealth = async (req, res) => {
    try {
      const healthStatus = {
        status: "success",
        message: "Health is OK",
        data: {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      };
      res.success(healthStatus);
    } catch (error) {
      res.error({
        status: "error",
        message: "Internal Server Error",
      });
    }
  };
  
  module.exports = {
    getHealth,
  };