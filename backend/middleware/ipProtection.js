const rateMap = new Map();

const LIMIT = 50;
const WINDOW = 60*100;

module.exports = (req,res,next) =>{
    const ip = req.ip;
    const now = Date.now();
    
    if(!rateMap.has(ip)){
        rateMap.set(ip,[]);
    }

    const timestamps = rateMap.get(ip).filter(t=>now - t < WINDOW);
    timestamps.push(now);
    rateMap.set(ip,timestamps);

    if(timestamps.length > LIMIT){
        return res.status(429).json({
            error:"Too many attempts - possible abuse detected"
        });
    }
    next();
}