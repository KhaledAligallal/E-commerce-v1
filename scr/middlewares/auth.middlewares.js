
import jwt from 'jsonwebtoken'
import User from '../../DB/models/User.model.js'

export const auth = (accessRoles) => {
    return async (req, res, next) => {
        try {
            const { accesstoken } = req.headers
            if (!accesstoken) return next(new Error('please login first', { cause: 400 }))

            if (!accesstoken.startsWith(process.env.TOKEN_PREFIX)) return next(new Error('invalid token prefix', { cause: 400 }))

            const token = accesstoken.split(process.env.TOKEN_PREFIX)[1]

         
            const decodedData = jwt.verify(token, process.env.JWT_SECRET_LOGIN)

            if (!decodedData || !decodedData.id) return next(new Error('invalid token payload', { cause: 400 }))


            const findUser = await User.findById(decodedData.id,'username email role').lean()
            if (!findUser) return next(new Error('please signUp first', { cause: 404 }))
            if (!accessRoles.includes(findUser.role)) return next(new Error('you are not allowed to access this route', { cause: 401 }))
            req.authUser = findUser
    
            next()
        } catch (error) {
            console.log(error)
           /* if (error == 'TokenExpiredError: jwt expired') {
                console.log(token);
                const finduser = await User.findOne( {token} )
               
                if (!finduser) return next(new Error('token is not found', { cause: 404 }))

                const userToken = jwt.sign(
                    { email, id: finduser._id, loggedIn: true },
                    process.env.JWT_SECRET_LOGIN, { expiresIn: '30s' })

                finduser.isLoggedIn = true
                finduser.token = userToken

                await finduser.save()

                res.status(200).json({
                    success: true,
                    message: 'refreshed token',
                    data: {
                        userToken
                    },
                    finduser
                })
            }*/
           next(new Error('catch error in auth middleware', { cause: 500 }))
        }
    }
}
