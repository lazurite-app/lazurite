precision mediump float;

uniform float iGlobalTime;
uniform vec3 iResolution;

uniform float noiseAmplitude;
uniform float noiseDetail;
uniform float blobRadius;
uniform float hueShift;
uniform float cameraRotation;
uniform float cameraHeight;

uniform sampler2D waveformL0;
uniform sampler2D frequencyL0;


// ALL TAKEN FROM IQs AMAZING SITE / TUTORIALS / SHADERS:
// http://www.iquilezles.org/www/index.htm
// https://www.shadertoy.com/user/iq


const float MAX_TRACE_DISTANCE = 10.0;           // max trace distance
const float INTERSECTION_PRECISION = 0.001;        // precision of the intersection
const int NUM_OF_TRACE_STEPS = 200;


// Taken from https://www.shadertoy.com/view/4ts3z2
float tri(in float x){return abs(fract(x)-.5);}
vec3 tri3(in vec3 p){return vec3( tri(p.z+tri(p.y*1.)), tri(p.z+tri(p.x*1.)), tri(p.y+tri(p.x*1.)));}


// Taken from https://www.shadertoy.com/view/4ts3z2
float triNoise3D(in vec3 p, in float spd)
{
    float z=1.4;
  float rz = 0.;
    vec3 bp = p;
  for (float i=0.; i<=3.; i++ )
  {
        vec3 dg = tri3(bp*2.);
        p += (dg+iGlobalTime*1.1*spd);

        bp *= 1.8;
    z *= 1.5;
    p *= 1.2;
        //p.xz*= m2;

        rz+= (tri(p.z+tri(p.x+tri(p.y))))/z;
        bp += 0.14;
  }
  return rz;
}

float posToFloat( vec3 p ){

    float f = triNoise3D( p * .2 * noiseDetail, .1 );
    return f;

}

void buildBasis( in vec3 dir , in vec3 up , out vec3 x , out vec3 y , out vec3 z ){


 //vec3( 0. , 1. , 0. );
  //vec3  upVector = normalize( centerOfCircle );// vec3( 0. , 1. , 0. );
  float upVectorProj = dot( up , dir );
  vec3  upVectorPara = upVectorProj * dir;
  vec3  upVectorPerp = up - upVectorPara;

  vec3 basisX = normalize( upVectorPerp );
  vec3 basisY = cross( dir , basisX );


  x = basisX;
  y = basisY;
  z = dir;

}


float udBox( vec3 p, vec3 b )
{
  return length(max(abs(p)-b,0.0));
}


float udRoundBox( vec3 p, vec3 b, float r )
{
  return length(max(abs(p)-b,0.0))-r;
}


//----
// Camera Stuffs
//----
mat3 calcLookAtMatrix( in vec3 ro, in vec3 ta, in float roll )
{
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(sin(roll),cos(roll),0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    return mat3( uu, vv, ww );
}

void doCamera( out vec3 camPos, out vec3 camTar, in float time, in float mouseX )
{
    float an = 0.3 + 10.0*mouseX;
  camPos = vec3(3.5*sin(an),2.0,3.5*cos(an));
    camTar = vec3(0.0,0.0,0.0);
}

// ROTATION FUNCTIONS TAKEN FROM
//https://www.shadertoy.com/view/XsSSzG
mat3 xrotate(float t) {
  return mat3(1.0, 0.0, 0.0,
                0.0, cos(t), -sin(t),
                0.0, sin(t), cos(t));
}

mat3 yrotate(float t) {
  return mat3(cos(t), 0.0, -sin(t),
                0.0, 1.0, 0.0,
                sin(t), 0.0, cos(t));
}

mat3 zrotate(float t) {
    return mat3(cos(t), -sin(t), 0.0,
                sin(t), cos(t), 0.0,
                0.0, 0.0, 1.0);
}


mat3 fullRotate( vec3 r ){

   return xrotate( r.x ) * yrotate( r.y ) * zrotate( r.z );

}

float rotatedBox( vec3 p , vec3 rot , vec3 size , float rad ){

    vec3 q = fullRotate( rot ) * p;
    return udRoundBox( q , size , rad );


}



// checks to see which intersection is closer
// and makes the y of the vec2 be the proper id
vec2 opU( vec2 d1, vec2 d2 ){

  return (d1.x<d2.x) ? d1 : d2;

}

//--------------------------------
// Modelling
//--------------------------------
vec2 map( vec3 pos ){
     float scale = mix(1.0, texture2D(frequencyL0, vec2(0.0275)).r * 0.5 + 0.5, noiseAmplitude) + (blobRadius - 1.0);
     vec2 res = vec2( rotatedBox( pos ,
       vec3( iGlobalTime * .05 * 26. + 1., iGlobalTime * .02 * 26. + 2. , iGlobalTime * .03 * 26.  ), vec3( 0.7 * scale ) , .1 ) , 1.0 );
     //vec2 res2 = vec2( sdPlane( pos - vec3( 0. , -1. , 0. )), 0.0 );
     //vec2 res2 = vec2( sdSphere( pos - vec3( 0. , 0. , 0. ) , .5 ), 0.0 );
    //res = opU( res ,  res2 );
     return res;

}

vec2 calcIntersection( in vec3 ro, in vec3 rd ){


    float h =  INTERSECTION_PRECISION*2.0;
    float t = 0.0;
  float res = -1.0;
    float id = -1.;

    for( int i=0; i< NUM_OF_TRACE_STEPS ; i++ ){

        if( h < INTERSECTION_PRECISION || t > MAX_TRACE_DISTANCE ) break;
       vec2 m = map( ro+rd*t );
        h = m.x;
        t += h;
        id = m.y;

    }

    if( t < MAX_TRACE_DISTANCE ) res = t;
    if( t > MAX_TRACE_DISTANCE ) id =-1.0;

    return vec2( res , id );

}


#define STEPS 50
float fogCube( vec3 ro , vec3 rd , vec3 n ){

    float lum = 1.;
    for( int i = 0; i < STEPS; i++ ){
        vec3 p = ro + rd * .01  * float( i );
        lum += posToFloat( p );// + sin( p.y * 3. ) + sin( p.z * 5.);
    }

    return lum;


}

// Calculates the normal by taking a very small distance,
// remapping the function, and getting normal for that
vec3 calcNormal( in vec3 pos ){

  vec3 eps = vec3( 0.001, 0.0, 0.0 );
  vec3 nor = vec3(
      map(pos+eps.xyy).x - map(pos-eps.xyy).x,
      map(pos+eps.yxy).x - map(pos-eps.yxy).x,
      map(pos+eps.yyx).x - map(pos-eps.yyx).x );
  return normalize(nor);
}


vec3 hsv(float h, float s, float v)
{
  return mix( vec3( 1.0 ), clamp( ( abs( fract(
    h + vec3( 3.0, 2.0, 1.0 ) / 3.0 ) * 6.0 - 3.0 ) - 1.0 ), 0.0, 1.0 ), s ) * v;
}

void main()
{
    vec2 p = (-iResolution.xy + 2.0*gl_FragCoord.xy)/iResolution.y;
    vec2 m = vec2(0.0);

    //-----------------------------------------------------
    // camera
    //-----------------------------------------------------

    // camera movement
    vec3 ro, ta;
    doCamera( ro, ta, iGlobalTime, cameraRotation );

    ro.y += cameraHeight;

    // camera matrix
    mat3 camMat = calcLookAtMatrix( ro, ta, 0.0 );  // 0.0 is the camera roll

  // create view ray
  vec3 rd = normalize( camMat * vec3(p.xy,2.0) ); // 2.0 is the lens length

    vec2 res = calcIntersection( ro , rd  );


    vec3 col = vec3( 0. );

    if( res.y > -.5 ){

        vec3 pos = ro + rd * res.x;
        vec3 norm = calcNormal( pos );

         vec3 lightPos = vec3( 5. , 5. , 5. );

        lightPos -= pos;
        lightPos = normalize( lightPos );

        vec3 refl = reflect( lightPos , norm );

        float eyeMatch = max( 0. , dot( refl , rd ) );
        float lamb =max( 0.0 , dot( lightPos , norm ));

        // pos.y += texture2D(waveformL0, pos.xz * 0.1).r;
        float lum = fogCube( pos , rd , norm ) * texture2D(frequencyL0, vec2(0.0075)).r + 10.;
       // col = norm * .5 + .5;

        float lu = max( 0.0 , -dot( lightPos , norm ));

        vec3 nCol = hsv( posToFloat( pos ) + 0.3 + hueShift , .4 , 1.);
        nCol *=pow( lum / 20. , min( 5. , 1./eyeMatch) ) * eyeMatch;

        vec3 col2 = hsv( posToFloat( pos ) + .6 + hueShift, .6, .4);
        nCol += lamb * col2 * pow( lum / 20. , min( 5. , 1./eyeMatch) ) * ( 1. - eyeMatch );

        vec3 col3 = hsv( posToFloat( pos) + .6 + hueShift, .9, .2);
        nCol += col3 * pow( lum / 20. , min( 5. , 1./eyeMatch) ) * ( 1. - lamb );

       // nCol +=  vec3( .2 ) * ( 1. - eyeMatch );
       // nCol *= hsv( abs(sin(lum * .1)) , .5 , 1. );

        //nCol += pow( eyeMatch , 10. ) * vec3( 1. );//hsv( eyeMatch * 1. , .5 , 1. );
        col += nCol;


    }

    gl_FragColor = vec4( col , 1. );
}
