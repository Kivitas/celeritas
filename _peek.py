import sys  
f=open("src/App.tsx","r",encoding="utf-8")  
lines=f.readlines()  
f.close()  
for i in range(538,642): sys.stdout.write(str(i+1)+": "+lines[i])  
