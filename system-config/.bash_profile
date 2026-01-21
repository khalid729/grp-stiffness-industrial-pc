# Auto-start X on tty1
if [[ -z $DISPLAY ]] && [[ $(tty) = /dev/tty1 ]]; then
    clear
    exec startx -- -nocursor > /dev/null 2>&1
fi
