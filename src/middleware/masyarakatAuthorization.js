const jwt = require('jsonwebtoken')

const authorizeMasyarakat = (req, res, next) => {
    const token = req.headers.authorization
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' })
    }

    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.role !== 'masyarakat') {
            return res.status(403).json({ message: 'unauthorized' })
        }
        next()
    } catch (error) {
        return res.status(401).json({ message: 'token invalid' })
    }
}

module.exports = authorizeMasyarakat;