# Camera-ready seeding paste

Open the deployed app **signed in as the caregiver you'll film with**, press
F12 → Console, paste the whole block, hit Enter, then **reload the page**.

It seeds, for the current care circle only:
- A **7-day check-in streak** → the campfire burns at full "day 7" intensity.
  Set `INCLUDE_TODAY = false` instead if you want to film the *fire-lights-up*
  moment live (streak shows day 6; tapping a mood on camera feeds it).
- **Three photos** in the family album with warm captions, so "📷 Look at our
  photos" and "Tell me about this photo" have something beautiful to show.

It does **not** touch the profile, memories, FAQs, logs, routine, or chat —
the built-in Eleanor demo data stays as-is.

```js
(() => {
  const INCLUDE_TODAY = true; // false → day-6 streak, light the fire on camera

  const circle = localStorage.getItem('yadira_user_id') || 'default-circle';
  const k = (key) => `yadira_${circle}_${key}`;
  const fmt = (d) => d.toLocaleDateString([], { month: '2-digit', day: '2-digit' }).replace('/', '-');

  // --- 7-day check-in streak (feeds the campfire) ---
  const moods = ['peaceful', 'peaceful', 'anxious', 'peaceful', 'sad', 'peaceful', 'peaceful'];
  const checkins = [];
  for (let i = INCLUDE_TODAY ? 0 : 1; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    checkins.push({ date: fmt(d), mood: moods[i], at: Date.now() - i * 864e5 });
  }
  localStorage.setItem(k('checkins'), JSON.stringify(checkins));

  // --- Photo album (painted scenes + captions Yadira can talk about) ---
  const paint = (draw) => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 480;
    const g = c.getContext('2d'); draw(g); return c.toDataURL('image/jpeg', 0.8);
  };
  const lake = paint((g) => {
    let gr = g.createLinearGradient(0, 0, 0, 480);
    gr.addColorStop(0, '#BFD8E8'); gr.addColorStop(0.55, '#7FA8C4'); gr.addColorStop(1, '#3E617C');
    g.fillStyle = gr; g.fillRect(0, 0, 640, 480);
    g.fillStyle = '#2E4B60'; g.beginPath();
    g.moveTo(0, 300); g.lineTo(140, 190); g.lineTo(300, 300); g.lineTo(460, 170); g.lineTo(640, 300);
    g.lineTo(640, 480); g.lineTo(0, 480); g.fill();
    g.fillStyle = '#EAF4FA'; g.fillRect(0, 300, 640, 8);
    g.fillStyle = '#FFF6D8'; g.beginPath(); g.arc(520, 90, 42, 0, 7); g.fill();
  });
  const roses = paint((g) => {
    g.fillStyle = '#EAF3EC'; g.fillRect(0, 0, 640, 480);
    for (let i = 0; i < 24; i++) {
      const x = 40 + (i % 6) * 110, y = 60 + Math.floor(i / 6) * 105;
      g.fillStyle = ['#C97B84', '#B85C6B', '#D98E96'][i % 3];
      g.beginPath(); g.arc(x, y, 28, 0, 7); g.fill();
      g.fillStyle = '#3A5D45'; g.fillRect(x - 3, y + 26, 6, 44);
    }
  });
  const dance = paint((g) => {
    let gr = g.createRadialGradient(320, 240, 40, 320, 240, 380);
    gr.addColorStop(0, '#F7E9CE'); gr.addColorStop(1, '#8A6A45');
    g.fillStyle = gr; g.fillRect(0, 0, 640, 480);
    g.fillStyle = '#3A2A20';
    g.beginPath(); g.arc(280, 200, 34, 0, 7); g.fill();
    g.beginPath(); g.arc(360, 200, 34, 0, 7); g.fill();
    g.fillRect(250, 230, 140, 160);
  });
  const photos = [
    { id: 'seed-lake', dataUrl: lake, caption: 'Edward and Eleanor at the lake house, summer 1974', emotion: 'joyful', addedAt: Date.now() - 3 * 864e5, addedBy: 'caregiver' },
    { id: 'seed-roses', dataUrl: roses, caption: "Eleanor's hybrid tea roses in full bloom, the spring she won the garden club ribbon", emotion: 'proud', addedAt: Date.now() - 2 * 864e5, addedBy: 'caregiver' },
    { id: 'seed-dance', dataUrl: dance, caption: 'Dancing to "Can\'t Help Falling in Love" at the wedding reception', emotion: 'tender', addedAt: Date.now() - 864e5, addedBy: 'patient' },
  ];
  localStorage.setItem(k('gallery'), JSON.stringify(photos));

  console.log(`✅ Seeded ${checkins.length} check-ins + ${photos.length} photos for circle "${circle}". Reload the page.`);
})();
```

**If Firebase sync is configured** on the deployment: the cloud copy wins over
localStorage on load. After pasting + reloading, make one tiny edit through
the UI in each seeded area (recaption one photo; tap today's mood) — that
pushes the whole seeded list up to Firestore so every device sees it.
