# This should be a shellscript that ensures all our mounts are present and accounted for.

mkdir -p /mnt/samba
if mountpoint -q /mnt/samba; then
    echo "Already mounted."
else
    mount.cifs //<ip>/<share> /mnt/samba -o "username=asdf,password=password,nounix,sec=ntlmssp,vers=3.0"
fi
