import { scheduleJob } from "node-schedule";
import {DateTime} from "luxon"
import Coupon from '../../DB/models/coupon.model.js'




export function cronToChangeExpiredCoupons(){
    scheduleJob('*/5 * * * * *', async () => {
        console.log('cronToChangeExpiredCoupons()  is running every 5 seconds');
        const coupons = await Coupon.find({couponStatus:'valid'})
        for (const coupon of coupons) {
            // if(
            //     moment().isAfter(moment(coupon.toDate))
            // ){
            //      coupon.couponStatus = 'expired'
            // }

            // console.log({
            //     toDate: DateTime.fromJSDate(new Date(coupon.toDate)),
            //     now: DateTime.now()
            // });

            if(
                DateTime.fromISO(coupon.toDate) < DateTime.now()
            ){
                coupon.couponStatus = 'expired'  
            }
            await coupon.save()
        }

    })
}

export function cronToChangeExpiredCouponsV1(){
    scheduleJob('*/5 * * * * *', async () => {
        console.log('cronToChangeExpiredCoupons()  is running every 5 seconds V1');
    })
}
export function cronToChangeExpiredCouponsV2(){
    scheduleJob('*/5 * * * * *', async () => {
        console.log('cronToChangeExpiredCoupons()  is running every 5 seconds V2');
    })
}
export function cronToChangeExpiredCouponsV3(){
    scheduleJob('*/5 * * * * *', async () => {
        console.log('cronToChangeExpiredCoupons()  is running every 5 seconds V3');
    })
}