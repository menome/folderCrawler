# File Crawler

## Setup

1. On a windows machine, download and install NodeJS
2. Install GIT shell 
3. Open a powershell terminal after install 
4. Navigate to the download directory and run `npm install` 

## Configuration

Edit `config/config.json` to configure how the crawler connects to Minio and Neo4j.

Edit `config/folders.txt` so that it contains lines of the form:
```
<absolute path to source>:<path to destination in Minio>
/home/konrad/menome/misc/crawler_test:test_import
```
You can begin a line with a `#` character and that line will be ignored in the input.

Inside of Docker, the folders.txt config should have absolute source paths as they can be found inside the container. You should mount any volumes you wish to crawl inside the container with standard docker container mappings.

### Samba/NFS/Other Mount Type Configuration

Alternatively, the application also supports mounting of external volumes. 
To do this, create a shellscript called `config/mount.sh`
This shellscript should synchronously ensure that all directories are mounted, and should return a nonzero status code on failure.

Example: 
```
mount.cifs //192.168.1.30/share /mnt/samba -o "username=menome,password=securepassword,nounix,sec=ntlmssp,vers=3.0"
```

The application will use this shellscript to ensure that all volumes are mounted before starting a crawl.

**NOTE:** To mount these external volumes from within the container, you must run the container in privileged mode.

## Usage

You can either use `npm start` to run the application as a web microservice. Sending a POST request to `/crawl` will cause the application to crawl the folders.

Alternatively, run `npm run exec` to simply crawl the folders once and exit.