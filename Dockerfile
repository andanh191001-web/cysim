# Sử dụng Python bản nhẹ
FROM python:3.11-slim

# Tạo thư mục làm việc
WORKDIR /app

# Copy file requirements và cài đặt
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code server
COPY server/ .

# Chạy ứng dụng (file gemini_proxy.py sẽ tự đọc biến PORT)
CMD ["python", "gemini_proxy.py"]