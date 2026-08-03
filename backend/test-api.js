// Use the token directly from the user's request
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tIjoiQWRtaW4iLCJlbWFpbCI6ImFkbWluQGVycC5sb2NhbCIsInJvbGUiOiJtYW5hZ2VyIiwiaWF0IjoxNzczODQ4OTQzLCJleHAiOjE3NzM5MzUzNDN9.8flHQKB1HLdd4DorCwAfPUL-evZZwBIPfNNAfGHxn74';

fetch('https://erp-529s.onrender.com/api/dashboard/stats?range=7days', {
    headers: { 
        'Authorization': `Bearer ${token}`,
        'Origin': 'https://erp-eight-navy.vercel.app'
    }
}).then(async res => {
    console.log("HTTP STATUS:", res.status);
    const text = await res.text();
    try {
        console.log("RESPONSE:", JSON.stringify(JSON.parse(text), null, 2));
    } catch {
        console.log("RESPONSE (raw):", text);
    }
}).catch(err => {
    console.error("NETWORK ERROR:", err.message);
});
