import pyaudio
import numpy as np
import time
import os
import webbrowser # Library untuk buka browser

# --- KONFIGURASI ---
THRESHOLD = 3000            # Sensitivitas (ubah jika perlu)
TAP_NEEDED = 3              
TIMEOUT = 1.5               
COOLDOWN = 3.0              
# Ganti link ini dengan lagu/playlist favoritmu
YOUTUBE_URL = "https://youtu.be/_wpkSfZBg2I?si=oi_xsOqDj3Qg_VKq"

def eksekusi_musik():
    print("\n>>> MENJALANKAN MISI MUSIK... <<<")
    
    # Buka YouTube di Browser
    print("- Membuka YouTube...")
    webbrowser.open(YOUTUBE_URL)

def main():
    p = pyaudio.PyAudio()
    try:
        default_device = p.get_default_input_device_info()
        print(f"Input device: {default_device['name']}")
    except Exception:
        print("Tidak dapat membaca device input default.")

    try:
        stream = p.open(format=pyaudio.paInt16, channels=1, rate=44100,
                        input=True, frames_per_buffer=1024)
    except Exception as e:
        print(f"Gagal membuka stream audio: {e}")
        p.terminate()
        return

    print("--- Sistem Ketuk 3 Kali Aktif ---")
    print("Ketuk bodi laptop 3 kali untuk mulai...")
    print("(Jika tidak ada output ketukan, coba turunkan THRESHOLD.)")

    taps = 0
    last_tap_time = 0

    try:
        while True:
            try:
                data = stream.read(1024, exception_on_overflow=False)
            except Exception as e:
                print(f"Error membaca audio: {e}")
                time.sleep(0.2)
                continue

            peak = np.max(np.abs(np.frombuffer(data, dtype=np.int16)))
            current_time = time.time()

            if peak > 1000:
                print(f"Peak: {peak}")

            if peak > THRESHOLD:
                if current_time - last_tap_time > 0.2:
                    taps += 1
                    last_tap_time = current_time
                    print(f"Ketukan {taps}! (Power: {peak})")

            if taps > 0 and (current_time - last_tap_time) > TIMEOUT:
                taps = 0  # Reset jika terlalu lama

            if taps >= TAP_NEEDED:
                eksekusi_musik()
                taps = 0
                time.sleep(COOLDOWN)
                print("\nSiap mendengarkan ketukan lagi...")

    except KeyboardInterrupt:
        print("\nProgram dimatikan.")
    finally:
        try:
            stream.stop_stream()
            stream.close()
        except Exception:
            pass
        p.terminate()

if __name__ == "__main__":
    main()

