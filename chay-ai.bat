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
REM           khoi dong lai sau 5 giay; vong lap chi dung khi exit code 0 hoac
REM           0xC000013A, tuc la nguoi dung muon dung that.
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

:loop
echo [CySim] Starting the local Gemini proxy on http://127.0.0.1:8000
echo         Keep this window open while you use the AI chat.
echo         Close it or press Ctrl+C to stop.
echo.
python server\gemini_proxy.py
set EC=%ERRORLEVEL%
REM Exit 0 = Ctrl+C / clean stop. 3221225786 (0xC000013A) = the console killed
REM python. Anything else means the process died on its own (a dropped Google
REM connection, an out-of-memory thread): the chat would look "broken" again
REM with no window left to read, so restart it instead of closing.
if "%EC%"=="0" goto end
if "%EC%"=="3221225786" goto end
echo.
echo [CySim] Proxy exited unexpectedly (code %EC%). Restarting in 5 seconds...
echo         Press Ctrl+C to give up, or close this window.
timeout /t 5 /nobreak >nul
goto loop

:end
echo.
echo [CySim] Proxy stopped. AI chat needs this window open.
pause
