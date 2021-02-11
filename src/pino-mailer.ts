import split from 'split2'
import pump from 'pump'
import through from 'through2'
import nodemailer from 'nodemailer'

import * as dotenv from 'dotenv'
dotenv.config()

const transport = through.obj(async (chunk, enc, cb) => {
  const mailer = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: 25,
    secure: false,
    ignoreTLS: true
  })

  const message = JSON.stringify({...chunk, time: new Date(chunk.time)}, null, 4)

  await mailer.sendMail({
    from: 'Qlik Sense <qliksense@honegger.ch>',
    to: 'f.lardieri@honegger.ch',
    subject: `FEHLER: Qlik Sense Import Manager Job`,
    text: message,
    html: `<pre>${message.replace(/\\n /g, '<br />     ')}</pre>`,
  })

  console.log(JSON.stringify(chunk))
  cb()
})

pump(process.stdin, split(JSON.parse), transport)
