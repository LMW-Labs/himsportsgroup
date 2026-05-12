import 'dotenv/config'

const token = process.env.TELEGRAM_BOT_TOKEN
const webhookUrl = process.argv[2]

if (!webhookUrl) {
  console.error('Usage: node scripts/set-webhook.js https://your-domain.vercel.app/api/telegram')
  process.exit(1)
}

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: webhookUrl })
})

const data = await res.json()
console.log(data)
