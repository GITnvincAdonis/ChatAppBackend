function ValidateToken(req, res, next) {
    const bearerHead = req.headers['authorization'];
    if (typeof bearerHead !== 'undefined') {
      const bearer = bearerHead.split(" ");
      const token = bearer[1];
      req.token = token; // Assign token to req
      next();
    } else {
      res.sendStatus(403); // Forbidden
    }
  }
  
module.exports = {ValidateToken}