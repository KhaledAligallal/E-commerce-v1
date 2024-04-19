
import db_connection from "../DB/connection.js"
import * as routers from '../scr/modules/index.routes.js'
import { gracefulShutdown } from "node-schedule"
import { cronToChangeExpiredCoupons, cronToChangeExpiredCouponsV1, cronToChangeExpiredCouponsV2, cronToChangeExpiredCouponsV3 } from "./Utlis/crons.js"
import { globalResponse } from "./middlewares/global-response.js"
import { rollbackSavedDocuments } from "./middlewares/rollback-saved-documnets.middleware.js"
import { rollbackUploadedFiles } from "./middlewares/rollback-uploaded-files.middleware.js"



export const initiateApp = (app, express) => {



    const port = process.env.port
    app.use(express.json())

    db_connection()


    app.use('/user', routers.userRouter)
    app.use('/auth', routers.authRouter)
    app.use('/category', routers.categoryRouter)
    app.use('/subcategory', routers.supCategoryRouter)
    app.use('/brand', routers.brandRouter)
    app.use('/product', routers.productRouter)
    app.use('/cart', routers.cartRouter)
    app.use('/coupon', routers.couponRouter)
    app.use('/order', routers.orderRouter)
    app.use('/review',routers.reviewRouter)

    
    app.use('*', (req,res,next)=>{
        res.status(404).json({message: 'Not found'})
    })


    app.use(globalResponse, rollbackUploadedFiles, rollbackSavedDocuments)


    cronToChangeExpiredCouponsV1()
    cronToChangeExpiredCouponsV2()
    cronToChangeExpiredCouponsV3()
    cronToChangeExpiredCoupons()
    gracefulShutdown()



    app.listen(port, () => { console.log('server is running') })



}