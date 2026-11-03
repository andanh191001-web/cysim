@echo off
REM =========================================================
REM CySim - chay-ai.bat : launcher cho may noi Gemini (server/gemini_proxy.py)
REM
REM LA GI   : Chi mot file double-click de khoi dong may chu noi dung
REM           http://127.0.0.1:8000 ma khung chat AI trong CySim can.
REM           Trieu de ton tai cua file nay: lenh "python server\gemini_proxy.py"
REM           phai dan ty trong cua so lenh, dong cua so la dong chuong trinh,
REM           va nguoi dung mo app bang Live Server thi khong biet phai chay gi.
REM CHAY    : doi Python trong PATH -> kiem tra SDK "google.genai" da cai that
REM           su (thieu thi in lenh pip cai va dung tai day, thay vi de proxy
REM           chet im ben trong vong lap) -> chay proxy -> giu cua so mo.
REM           Proxy chet bat ngo (loi ket noi Google, xung bot nho) thi TU DONG
REM           khoi dong lai sau 5 giay, nhung TOI DA 5 LAN roi dung. vong lap
REM           dung ngay khi exit code 0 hoac 0xC000013A, tuc la nguoi dung muon
REM           dung that.
REM           Vi sao phai co tran: ba benh chet KHONG phuc hoi duoc - sai hoac
REM           thieu GEMINI_API_KEY trong .env, cong 8000 da nguoi khac giu, thieu
REM           quyen mo cua. De vo han thi cua so sang len roi tat mai mai ma
REM           khong bao gio khoi, va nguoi dung go duoc "may chu AI chua chay"
REM           trong khi bat cu lenh nao giup duoc thi da tu chay. Lan thu 5, cua
REM           so in ra lenh doc traceback that va dung lai; mo lai file nay la
REM           bo dem tu dong ve 0 (no nam trong bien cua tien trinh nay).
REM           Moi lan proxy chet, mot dong co moc gio duoc ghi vao
REM           %TEMP%\cysim-chay-ai.log: thoi diem, exit code, so lan da restart.
REM           Log nam NGOAI repo (khong tinh vao 52 file) va du tra loi "no chet
REM           luc nao, may lan", KHONG thay duoc traceback - traceback chi co tren
REM           man hinh, nen cua so in ra exit code truoc khi restart.
REM           Tu 01-11-2026 cua so con in ngay khi bat ba dong ve cai key: hinh
REM           dang cua no trong .env ("AQ..." = dang key hien nay cua AI Studio;
REM           "AIza..." = dang cu; dung dang van co the da bi Google thu hoi/chan
REM           vi lo - day la benh that cua may nay 01..03-11-2026, khien khung chat bao "da noi duoc may chu AI"
REM           trong khi khong cau hoi nao goi duoc), ket luan Google nhan hay duoi,
REM           va chi tiet Google tra ve. Khong can mo terminal nao de doc traceback
REM           nua. Doi/sua key trong .env thi KHONG can tat-bat lai cua so nay:
REM           proxy so mtime cua .env va nap lai khi file thay doi.
REM           Tam dung: Ctrl+C trong cua so nay, hoac tat cua so.
REM AN TOAN : API key KHONG nam trong file nay. Proxy tu doc .env o cung
REM           cha (bien GEMINI_API_KEY). Muon doi key thi sua .env.
REM           File viet bang tieng Anh khong dau vi cmd.exe o codepage 8-bit
REM           se hoi hoa ra ran khi gap dau sach/ky tu Unicode.
REM =========================================================
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo [CySim] Python not found in PATH.
  echo         Install Python 3.10+ then run:
  echo             python -m pip install -r server\requirements.txt
  pause
  exit /b 1
)

REM Python in PATH is not enough: the proxy needs the google-genai SDK. Without
REM this check the window flashed, python died on ImportError deep inside the
REM loop, and the chat just said "server offline" - the same symptom as forgetting
REM to start it. So verify the import once, here, and print the fix command.
python -c "import google.genai" >nul 2>nul
if errorlevel 1 (
  echo [CySim] Python is installed but the Google SDK is missing.
  echo         Run this once, then start this file again:
  echo             python -m pip install -r server\requirements.txt
  pause
  exit /b 1
)

if not exist .env (
  echo [CySim] Missing .env - copy .env.example to .env and put your
  echo         GEMINI_API_KEY in it. See README.md, section "May noi AI".
  echo.
)

REM Restart budget + the log that answers "when did it die, how many times".
REM Counters live in this process only: relaunching the .bat starts at zero,
REM which is exactly the reset a teacher wants between two lessons.
set MAX_RESTART=5
set /a RUNS=0
set /a RESTARTS=0
set LOG=%TEMP%\cysim-chay-ai.log

:loop
echo [CySim] Starting the local Gemini proxy on http://127.0.0.1:8000
echo         Keep this window open while you use the AI chat.
echo         Close it or press Ctrl+C to stop.
echo.
python server\gemini_proxy.py
set EC=%ERRORLEVEL%
set /a RUNS+=1
>>"%LOG%" echo %DATE% %TIME% exit=%EC% run=%RUNS% restarts=%RESTARTS%
REM Exit 0 = Ctrl+C / clean stop. 3221225786 (0xC000013A) = the console killed
REM python. Anything else means the process died on its own (a dropped Google
REM connection, an out-of-memory thread): the chat would look "broken" again
REM with no window left to read, so restart it - but only MAX_RESTART times,
REM see :giveup for why the cap exists.
if "%EC%"=="0" goto end
if "%EC%"=="3221225786" goto end
if %RESTARTS% GEQ %MAX_RESTART% goto giveup
set /a RESTARTS+=1
echo.
echo [CySim] Proxy exited unexpectedly (code %EC%).
echo         Restart %RESTARTS% of %MAX_RESTART% in 5 seconds...
echo         Press Ctrl+C to give up, or close this window.
timeout /t 5 /nobreak >nul
goto loop

REM Five deaths in a row is no longer bad luck. The loop restarts a proxy that
REM loses a network call; it cannot restart a proxy that was never able to
REM start. Without this cap the window blinked forever and every real fix
REM (fill in .env, free port 8000) stayed hidden behind the blink.
:giveup
echo.
echo [CySim] Proxy died %MAX_RESTART% times in a row - NOT restarting again.
echo         Three causes do not heal by themselves:
echo           1. .env missing, or GEMINI_API_KEY wrong / revoked
echo           2. port 8000 is already held by another process
echo           3. python.exe has no permission to open that port
echo         The traceback this window scrolled past is the real answer. Read it:
echo             python server\gemini_proxy.py
echo         Or diagnose without talking to Google at all:
echo             python server\gemini_proxy.py --check
echo             netstat -ano ^| findstr :8000
echo         Death history (time + exit code): %LOG%
echo         Opening this file again resets the counter.
pause
exit /b 1

:end
echo.
echo [CySim] Proxy stopped. AI chat needs this window open.
pause
