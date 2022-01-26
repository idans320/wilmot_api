# How to Run

docker run  --restart unless-stopped -it -d --name wilmot -p 3000:3000 -e wilmot_admin=<Admin> -v /wilmot_data:/data/db -e password=<Password> wilmot:latest
