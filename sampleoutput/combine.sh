first=1
for var in "$@"; do 
	if [ $first -eq 1 ]; then
		cat $var > './output.txt'
		first=0
	else
		cat $var | tail -n +2 >> './output.txt'
	fi
done
