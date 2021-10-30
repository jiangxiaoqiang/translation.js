'use strict';

const Reddwarf = require( '../lib/reddwarf' ) ,
  youdao = new Reddwarf( { apiKey : '1361128838' , keyFrom : 'chrome' } ) ,
  nock = require( 'nock' );

nock.disableNetConnect();

require( './standard' )( Reddwarf );

describe( '有道翻译' , ()=> {
  it( '在初始化时若没有提供API Key及 key from则应该报错' , ()=> {
    let pass = 0;
    try {
      new Reddwarf();
    }
    catch ( e ) {
      pass += 1;
    }

    try {
      new Reddwarf( { apiKey : 'xxx' } );
    }
    catch ( e ) {
      pass += 1;
    }

    try {
      new Reddwarf( { keyFrom : 'xxx' } );
    }
    catch ( e ) {
      pass += 1;
    }

    try {
      new Reddwarf( { apiKey : 'xxx' , keyFrom : 'xxx' } );
    }
    catch ( e ) {
      pass += 1;
    }

    if ( pass !== 3 ) {
      fail( '没有API Key时应该报错' );
    }
  } );

  describe( '的 translate 方法' , ()=> {
    it( '在正常情况下会调用 transform 方法返回结果对象' , done => {
      const rawRes = {
        errorCode : 0 ,
        basic : {
          phonetic : '音标' ,
          explains : [ '解释1' , '解释2' ]
        } ,
        translation : [ '这里是翻译结果' ]
      };

      spyOn( youdao , 'transform' );

      nock( 'https://fanyi.youdao.com' )
        .get( '/openapi.do' )
        .query( true )
        .reply( 200 , rawRes );

      youdao
        .translate( { text : 'test' } )
        .then( result => {
          expect( youdao.transform ).toHaveBeenCalledWith( rawRes , { text : 'test' } );
          done();
        } , ()=> {
          fail( '错误的进入了 rejection 分支' );
          done();
        } );
    } );

    it( '在网络错误时应该被 reject' , done => {
      nock( 'https://fanyi.youdao.com' )
        .get( '/openapi.do' )
        .query( true )
        .replyWithError( 'some network error message' );

      youdao
        .translate( { text : 'test' } )
        .then( ()=> {
          fail( '错误的进入了 resolve 分支' );
          done();
        } , ()=> {
          done();
        } );
    } );
  } );

  describe( '的 transform 方法' , ()=> {
    it( '在有道接口返回错误码时会 resolve error' , ()=> {
      const rawRes = {
        errorCode : 20
      } , result = youdao.transform( rawRes , { text : 'test' } );

      expect( result ).toEqual( jasmine.objectContaining( {
        text : 'test' ,
        response : rawRes ,
        error : youdao.errMsg[ 20 ]
      } ) );
    } );

    it( '在有道接口返回正确格式数据时能正常转换' , ()=> {
      const rawRes = {
        errorCode : 0 ,
        basic : {
          phonetic : '音标' ,
          explains : [ '解释一' , '解释二' ]
        } ,
        translation : [ '翻译结果' ]
      } , result = youdao.transform( rawRes , { text : 'test' } );

      expect( result ).toEqual( {
        text : 'test' ,
        response : rawRes ,
        phonetic : '音标' ,
        detailed : rawRes.basic.explains ,
        result : rawRes.translation ,
        linkToResult : 'http://fanyi.youdao.com/translate?i=test'
      } );
    } );
  } );

  it( '的 audio 方法总是会调用 detect 获取自己的语种' , done => {
    const q = { text : 'test' , from : 'ja' };
    youdao.audio( q ).then( url => {
      expect( url ).toBe( 'http://tts.youdao.com/fanyivoice?keyfrom=fanyi%2Eweb%2Eindex&le=jap&word=test' );
      done();
    } , ()=> {
      fail( '错误的进入了 reject 分支' );
      done();
    } );
  } );
} );

