
const asyncHnadler = (requestHandler) =>{
     (req,res,next) =>{

        Promise
        .resolve(requestHandler(req,res,next))
        .catch((error) => next(error))
     }
}

module.exports = asyncHnadler;
// using try catch

// const asyncHnadler = (fn) => async (req,res,next) =>{

//     try{
//      await fn(req,res,next)
//     }catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }