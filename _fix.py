f=open("src/App.tsx","r",encoding="utf-8"
d=f.read()  
f.close()  
lines=d.splitlines()  
for i in range(786,800): print(f"{i+1}: {lines[i]}")  
