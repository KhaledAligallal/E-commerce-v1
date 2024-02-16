import express from 'express'
import { config } from 'dotenv'
import { initiateApp } from './scr/initiate-app.js'





config()
const app = express()

 initiateApp(app, express)

