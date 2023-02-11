# to start cron service:
# sudo service cron start

# this is the command that I use in the localhost:
# * * * * * bash $HOME/deneme.sh >> $HOME/backend/cron_log.txt 2>&1

# in production I should use:
# 0 4 * * * - runs the command every day at 4:00 AM.

#!/bin/sh
cd $HOME/kwl/backend;
source $HOME/kwl/backend/env/bin/activate;

# for debug
# CWD="$(pwd)"
# echo $CWD

python app/mail_cron_job.py