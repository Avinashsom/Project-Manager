const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise
        .resolve(requestHandler (req,res,next))
        .catch((err) => next(err))
    }
}

export { asyncHandler };
//it is higher order function in these function we can take input functions and return also funstions.