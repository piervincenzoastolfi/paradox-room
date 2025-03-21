
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { clicks, wait, profile, memory } = req.body;

  const prompt = `
Sei un generatore di scene per un gioco psicologico chiamato Paradox Room.
Genera una nuova scena JSON con:
- title
- description (può contenere {clicks} e {wait})
- loopTexts (2-4 frasi riflessive o disturbanti)
- background (classe Tailwind)
- audio (es. 'glitch.mp3')
- choices (2-3 oggetti con text e opzionalmente link)

Profilo del giocatore: ${profile}
Memoria: ${memory.slice(-5).join(' / ')}
Click: ${clicks}, Attesa: ${wait}s

Rispondi SOLO con JSON valido.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        temperature: 0.8,
        messages: [
          { role: "system", content: "Sei un motore narrativo immersivo e psicologico." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const json = JSON.parse(data.choices[0].message.content);
    res.status(200).json(json);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore GPT' });
  }
}
