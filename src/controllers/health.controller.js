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
  
      res.status(200).json(healthStatus);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  };
  
  module.exports = {
    getHealth,
  };