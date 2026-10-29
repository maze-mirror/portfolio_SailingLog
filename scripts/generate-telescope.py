import json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / 'assets'
W, H = 264, 126
# Radius profile of an extended, three-section terrestrial spyglass.
profile = [(-2.65,.29),(-2.62,.35),(-2.48,.35),(-2.44,.29),
           (-2.35,.29),(-2.32,.24),(-1.38,.24),(-1.36,.31),(-1.24,.31),
           (-1.21,.28),(-.48,.28),(-.46,.37),(-.32,.37),(-.28,.33),
           (.18,.33),(.22,.48),(.34,.48),(.38,.44),(1.70,.44),
           (1.74,.53),(1.92,.53),(1.96,.47),(2.02,.47)]
N = 64
verts=[]; faces=[]; materials=[]
for x,r in profile:
    for j in range(N):
        a=j*math.tau/N
        verts.append([x,r*math.cos(a),r*math.sin(a)])
for k in range(len(profile)-1):
    for j in range(N):
        a=k*N+j;b=k*N+(j+1)%N;c=(k+1)*N+j;d=(k+1)*N+(j+1)%N
        faces.extend([[a,c,b],[b,c,d]])
        # Textured grip, polished barrel, and raised rings.
        mat=1 if k in (0,1,2,6,7,10,11,14,15,18,19,20) else (2 if k==17 else 0)
        materials.extend([mat,mat])
def disk(x,r,mat):
    ci=len(verts);verts.append([x,0,0])
    for j in range(N):
        a=j*math.tau/N;verts.append([x,r*math.cos(a),r*math.sin(a)])
    for j in range(N):
        faces.append([ci,ci+1+j,ci+1+(j+1)%N]);materials.append(mat)
disk(-2.63,.285,3)
disk(2.01,.455,3)
V=np.array(verts); F=np.array(faces); M=np.array(materials)
light=np.array([-.35,.8,1.]);light/=np.linalg.norm(light)
chars=' .,:;irsXA253hMHGS#9B&@'
def frame(t):
    angle=math.radians(12+78*(t*t*(3-2*t)))
    ca,sa=math.cos(angle),math.sin(angle)
    R=np.array([[ca,0,sa],[0,1,0],[-sa,0,ca]])
    Q=V@R.T
    # A gentle diagonal inclination settles horizontally as the eyepiece faces us.
    roll=math.radians(-12*(1-t)); cr,sr=math.cos(roll),math.sin(roll)
    Q[:,:2]=Q[:,:2]@np.array([[cr,sr],[-sr,cr]])
    den=9-Q[:,2]
    P=np.stack([W/2+Q[:,0]*220*(W/156)/den,H/2-Q[:,1]*115*(W/156)/den],axis=1)
    depth=np.full((H,W),-np.inf); lum=np.zeros((H,W)); cov=np.zeros((H,W),bool); ink=np.zeros((H,W),np.uint8)
    for ids,mat in zip(F,M):
        pts=P[ids]; q=Q[ids]
        x0=max(0,int(np.floor(pts[:,0].min()))); x1=min(W-1,int(np.ceil(pts[:,0].max())))
        y0=max(0,int(np.floor(pts[:,1].min()))); y1=min(H-1,int(np.ceil(pts[:,1].max())))
        if x1<x0 or y1<y0:continue
        ax,ay=pts[0];bx,by=pts[1];cx,cy=pts[2]
        d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        if abs(d)<1e-7:continue
        yy,xx=np.mgrid[y0:y1+1,x0:x1+1];xx=xx+.5;yy=yy+.5
        a=((by-cy)*(xx-cx)+(cx-bx)*(yy-cy))/d
        b=((cy-ay)*(xx-cx)+(ax-cx)*(yy-cy))/d;c=1-a-b
        z=a*q[0,2]+b*q[1,2]+c*q[2,2]
        mask=(a>=-.001)&(b>=-.001)&(c>=-.001)&(z>depth[y0:y1+1,x0:x1+1])
        n=np.cross(q[1]-q[0],q[2]-q[0]);n/=max(1e-9,np.linalg.norm(n))
        if np.dot(n,q.mean(axis=0)-np.array([0,0,9]))>0:n=-n
        value=.2+.68*max(0,np.dot(n,light))
        if mat==1:value=min(1,value+.16)
        if mat==2:value=value*(.68+.24*((ids[0]%N)%3==0))
        if mat==3:
            # The glass is visible as a pale inner opening with a diagonal reflection.
            value=.025+.07*(xx/W)+.12*np.exp(-((xx-W*.49)-(yy-H*.5)*1.5)**2/8)
        view=lum[y0:y1+1,x0:x1+1];view[mask]=value if np.isscalar(value) else value[mask]
        inkview=ink[y0:y1+1,x0:x1+1]
        if mat==1: tone=0 if value<.85 else 1
        elif mat==3: tone=3
        elif mat==2: tone=1 if value<.55 else 2
        else: tone=1 if value<.35 else 2 if value<.68 else 3
        inkview[mask]=tone
        depth[y0:y1+1,x0:x1+1][mask]=z[mask];cov[y0:y1+1,x0:x1+1][mask]=True
    rows=[]; tones=''
    for y in range(H):
        row=''
        for x in range(W):
            if not cov[y,x]:row+=' ';continue
            val=max(.04,min(.99,lum[y,x]))
            row+=chars[1+int(val*(len(chars)-2))]
            tones+=str(ink[y,x])
        rows.append(row.rstrip())
    return {'rows':'\n'.join(rows),'ink':tones}

frames=[frame(i/79) for i in range(80)]
(OUT/'telescope-frames.json').write_text(json.dumps(frames,separators=(',',':')),encoding='utf-8')
print('Frames:',len(frames),'Bytes:',(OUT/'telescope-frames.json').stat().st_size)
