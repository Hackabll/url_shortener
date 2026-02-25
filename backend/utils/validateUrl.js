module.exports = function(urls){
    try{
        new URL(urls);
        return true;
    }catch {
        return false;
    }
}