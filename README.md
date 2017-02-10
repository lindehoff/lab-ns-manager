# Lab Nameserver Manager
in the works

## Setup
not complete

```bash
sudo visudo
nsmanager      ALL = NOPASSWD: /usr/sbin/service bind9 restart

sudo setfacl -m u:nsmanager:rw /etc/bind/zones/db.devopslab.xyz
```
