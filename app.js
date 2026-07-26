document.addEventListener("DOMContentLoaded", async () => {
    let db;
    let ownersHistory = [];
    let playlist = []; 
    let currentIndex = -1;
    let playMode = 0; 
    let shuffleQueue = [];
    let shuffleIndex = 0;

    const audio = document.getElementById('audio-player');
    const modeBtn = document.getElementById('mode-btn');
    const modes = ['🔁 All', '🔂 One', '🔀 Shuffle'];
    const currentName = window.webxdc.selfName || "Unknown User";

    // 1. مقداردهی دیتابیس
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MusicPlayerDB', 1);
            request.onupgradeneeded = (e) => {
                db = e.target.result;
                if (!db.objectStoreNames.contains('tracks')) {
                    db.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = (e) => { db = e.target.result; resolve(); };
            request.onerror = (e) => reject(e.target.error);
        });
    };

    const saveTrackToDB = (file) => {
        return new Promise((resolve) => {
            const tx = db.transaction('tracks', 'readwrite');
            const req = tx.objectStore('tracks').add({ name: file.name, blob: file });
            req.onsuccess = (e) => resolve(e.target.result);
        });
    };

    const deleteTrackFromDB = (id) => {
        const tx = db.transaction('tracks', 'readwrite');
        tx.objectStore('tracks').delete(id);
    };

    const loadTracksFromDB = () => {
        return new Promise((resolve) => {
            const tx = db.transaction('tracks', 'readonly');
            const req = tx.objectStore('tracks').getAll();
            req.onsuccess = (e) => resolve(e.target.result);
        });
    };

    await initDB();

    // 2. بارگذاری تاریخچه سازندگان
    try {
        const res = await fetch('history.json');
        if (res.ok) ownersHistory = await res.json();
    } catch (e) { console.log("No history"); }

    if (ownersHistory.length === 0) {
        ownersHistory.push(currentName);
    }

    // 3. استخراج موزیک‌ها (یکسان‌سازی نسخه گیرنده و فرستنده)
    let storedTracks = await loadTracksFromDB();
    
    // اگر دیتابیس خالی بود، یعنی برنامه تازه دریافت شده؛ پس موزیک‌ها رو از فایل زیپ وارد دیتابیس می‌کنیم
    if (storedTracks.length === 0) {
        try {
            const bundleRes = await fetch('bundled_list.json');
            if (bundleRes.ok) {
                const bundledList = await bundleRes.json();
                for (const fileName of bundledList) {
                    try {
                        const fileRes = await fetch(`bundled_music/${fileName}`);
                        const blob = await fileRes.blob();
                        blob.name = fileName; // ست کردن نام فایل
                        await saveTrackToDB(blob);
                    } catch (err) { console.error("Error importing track", err); }
                }
                storedTracks = await loadTracksFromDB(); // بروزرسانی لیست
            }
        } catch (e) { console.log("No bundled music found"); }
    }

    playlist = storedTracks.map(t => ({ ...t, url: URL.createObjectURL(t.blob) }));

    // 4. رفع مشکل Autoplay (با اولین لمس کاربر فعال می‌شود)
    document.body.addEventListener('click', function unlockAudio() {
        if (playlist.length > 0 && audio.paused && currentIndex === -1) {
            if (playMode === 2) { 
                generateShuffleQueue(); 
                playTrack(shuffleQueue[0]); 
            } else {
                playTrack(0);
            }
        }
        document.body.removeEventListener('click', unlockAudio);
    }, { once: true });

    if (playlist.length > 0) renderPlaylist();

    // نمایش نام آخرین ویرایشگر
    let ownerName = ownersHistory[ownersHistory.length - 1];
    if(!ownerName.toLowerCase().endsWith('s')) ownerName += "'s"; 
    
    const ownerNameEl = document.getElementById('owner-name');
    if (ownerNameEl) ownerNameEl.innerText = ownerName;

    // بستن پیام شروع
    setTimeout(() => {
        const intro = document.getElementById('intro-screen');
        if (intro) {
            intro.style.opacity = '0';
            setTimeout(() => {
                intro.style.display = 'none';
                const appContainer = document.getElementById('app-container');
                if (appContainer) appContainer.style.display = 'flex';
                checkFirstRun();
            }, 500);
        }
    }, 3000);

    function checkFirstRun() {
        if (!localStorage.getItem('guideShown')) {
            const modal = document.getElementById('guide-modal');
            if (modal) modal.classList.remove('hidden');
        }
    }
    
    const closeGuideBtn = document.getElementById('close-guide');
    if (closeGuideBtn) {
        closeGuideBtn.addEventListener('click', () => {
            document.getElementById('guide-modal').classList.add('hidden');
            localStorage.setItem('guideShown', 'true');
        });
    }

    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.loop = true;
        bgVideo.play().catch(e => console.log("Video auto-play blocked"));
    }

    if (modeBtn) {
        modeBtn.addEventListener('click', () => {
            playMode = (playMode + 1) % 3;
            modeBtn.innerText = modes[playMode];
            if (playMode === 2) generateShuffleQueue(); 
        });
    }

    // اضافه کردن موزیک (برای همه فعال است)
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            for (const file of files) {
                const id = await saveTrackToDB(file);
                const url = URL.createObjectURL(file);
                playlist.push({ id, name: file.name, blob: file, url });
            }
            
            renderPlaylist();
            if (playMode === 2) generateShuffleQueue(); 
            if (currentIndex === -1) playTrack(0);
        });
    }

    function renderPlaylist() {
        const listEl = document.getElementById('playlist');
        if (!listEl) return;
        listEl.innerHTML = '';
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            if (index === currentIndex) li.classList.add('playing');
            
            const span = document.createElement('span');
            span.className = 'track-name';
            span.innerText = track.name;
            span.onclick = () => {
                if(playMode === 2) {
                    shuffleIndex = shuffleQueue.indexOf(index);
                    if(shuffleIndex === -1) { generateShuffleQueue(); shuffleIndex = shuffleQueue.indexOf(index); }
                }
                playTrack(index);
            };
            li.appendChild(span);

            // امکان حذف برای همه فعال است
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.innerText = '✖';
            delBtn.onclick = () => {
                deleteTrackFromDB(track.id);
                playlist.splice(index, 1);
                if (currentIndex === index) { audio.pause(); currentIndex = -1; }
                else if (currentIndex > index) currentIndex--;
                renderPlaylist();
                if (playMode === 2) generateShuffleQueue();
            };
            li.appendChild(delBtn);
            
            listEl.appendChild(li);
        });
    }

    function playTrack(index) {
        if (playlist.length === 0 || index < 0 || index >= playlist.length) return;
        currentIndex = index;
        if (audio) {
            audio.src = playlist[index].url;
            audio.play().catch(e => console.log("Play blocked by browser:", e));
        }
        
        const trackNameEl = document.getElementById('current-track-name');
        if (trackNameEl) trackNameEl.innerText = playlist[index].name;
        
        const playBtn = document.getElementById('play-btn');
        if (playBtn) playBtn.innerText = '⏸';
        renderPlaylist(); 
    }

    function generateShuffleQueue() {
        if (playlist.length === 0) return;
        let newQueue = playlist.map((_, i) => i);
        for (let i = newQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }
        if (shuffleQueue.length > 0 && newQueue.length > 1) {
            let lastPlayed = shuffleQueue[shuffleQueue.length - 1];
            if (newQueue[0] === lastPlayed) {
                [newQueue[0], newQueue[1]] = [newQueue[1], newQueue[0]];
            }
        }
        shuffleQueue = newQueue;
        shuffleIndex = 0;
    }

    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (currentIndex === -1 && playlist.length > 0) {
                if (playMode === 2) { generateShuffleQueue(); playTrack(shuffleQueue[0]); }
                else playTrack(0);
            } else if (audio.paused) { 
                audio.play(); playBtn.innerText = '⏸'; 
            } else { 
                audio.pause(); playBtn.innerText = '▶'; 
            }
        });
    }

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.addEventListener('click', playNext);
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (playMode === 2 && shuffleIndex > 0) {
                shuffleIndex--;
                playTrack(shuffleQueue[shuffleIndex]);
            } else if (currentIndex > 0) playTrack(currentIndex - 1);
        });
    }

    if (audio) audio.addEventListener('ended', playNext);

    function playNext() {
        if (playlist.length === 0) return;
        if (playMode === 1) { 
            playTrack(currentIndex); 
        } else if (playMode === 2) { 
            shuffleIndex++;
            if (shuffleIndex >= shuffleQueue.length) generateShuffleQueue();
            playTrack(shuffleQueue[shuffleIndex]);
        } else { 
            if (currentIndex + 1 < playlist.length) playTrack(currentIndex + 1);
            else playTrack(0);
        }
    }

    // متد کمکی برای رفع خطای unsupported format اندروید با استفاده از FileReader
    const blobToArrayBuffer = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
        });
    };

    // اشتراک گذاری برنامه
    const shareBtn = document.getElementById('share-app-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            shareBtn.innerText = "⏳ Packaging...";
            shareBtn.disabled = true;

            try {
                // آپدیت کردن نام آخرین ویرایشگر
                if (ownersHistory[ownersHistory.length - 1] !== currentName) {
                    ownersHistory.push(currentName);
                }

                const zip = new JSZip();
                
                // لیست فایل‌های خام
                const coreFiles = [
                    'index.html', 'style.css', 'app.js', 'webxdc.js', 
                    'jszip.min.js', 'manifest.toml', 'icon.png',
                    '10e8aa75-d007-43cf-ba31-a9404dbb6864.png', 
                    '584afe11-a203-4f36-a723-78fff2d7cd97.mp4'
                ];
                
                for (const file of coreFiles) {
                    try {
                        const res = await fetch(file);
                        if (res.ok) zip.file(file, await res.arrayBuffer());
                    } catch (e) { console.log(e); }
                }

                const allTracks = await loadTracksFromDB();
                const bundledListExp = [];
                const musicFolder = zip.folder("bundled_music");

                for (const track of allTracks) {
                    // تبدیل Blob به ArrayBuffer برای سازگاری در اندروید
                    const buffer = await blobToArrayBuffer(track.blob);
                    musicFolder.file(track.name, buffer);
                    bundledListExp.push(track.name);
                }

                zip.file("bundled_list.json", JSON.stringify(bundledListExp));
                zip.file("history.json", JSON.stringify(ownersHistory));

                const content = zip.generate({ type: "uint8array", compression: "DEFLATE" });
                const newXdcBlob = new Blob([content], { type: "application/zip" });

                const exportName = `MusicPlayer_${ownersHistory[ownersHistory.length - 1]}.xdc`;
                
                await window.webxdc.sendToChat({
                    file: { name: exportName, blob: newXdcBlob },
                    text: `🎵 This Favorite Player contains ${bundledListExp.length} songs and was last edited by ${ownersHistory[ownersHistory.length - 1]} !`
                });

            } catch (err) {
                alert("خطا در ساخت پکیج جدید:\n" + (err.message || err));
            } finally {
                shareBtn.innerText = "🚀 Share App";
                shareBtn.disabled = false;
            }
        });
    }
});
