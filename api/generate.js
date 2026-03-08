export default async function handler(req, res) {

const { name, age, hobby, style } = req.body;

const prompt = `Write a ${style} birthday message for ${name} who is turning ${age}. 
${hobby ? `They enjoy ${hobby}.` : ""}
Keep it fun and under 60 words.`

const response = await fetch("https://api.openai.com/v1/chat/completions",{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`
},
body:JSON.stringify({
model:"gpt-4o-mini",
messages:[{role:"user",content:prompt}],
temperature:0.9
})
})

const data = await response.json()

res.status(200).json({
message:data.choices[0].message.content
})

}
