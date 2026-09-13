"use client";
import {createContext,useContext,useEffect,useRef,useState,ReactNode} from "react";
import {Language,translate} from "./translations";
const Context=createContext({lang:"en" as Language,setLanguage:(_lang:Language)=>{},t:(text:string|undefined)=>text??""});
export const useLanguage=()=>useContext(Context);
export function LanguageProvider({children}:{children:ReactNode}){
 const [lang,setLang]=useState<Language>("en"),[choose,setChoose]=useState(false),[choice,setChoice]=useState<Language>("en");const dialog=useRef<HTMLDialogElement>(null);
 function setLanguage(next:Language){setLang(next);try{localStorage.setItem("hifz-mentor-language",next)}catch{}setChoose(false)}
 useEffect(()=>{try{const saved=localStorage.getItem("hifz-mentor-language");if(saved==="en"||saved==="bn"){setLang(saved);return}}catch{}setChoose(true)},[]);
 useEffect(()=>{document.documentElement.lang=lang},[lang]);
 useEffect(()=>{if(choose)dialog.current?.showModal()},[choose]);
 return <Context.Provider value={{lang,setLanguage,t:text=>translate(text,lang)}}>{children}{choose&&<dialog ref={dialog} className="modal language-prompt" aria-labelledby="language-title" onCancel={e=>{e.preventDefault();setLanguage("en")}}><h2 id="language-title">Choose your language</h2><p lang="bn">আপনার ভাষা নির্বাচন করুন</p><fieldset><legend>Language / ভাষা</legend><label><input type="radio" name="welcome-language" value="en" checked={choice==="en"} onChange={()=>setChoice("en")}/>English <small>Default</small></label><label lang="bn"><input type="radio" name="welcome-language" value="bn" checked={choice==="bn"} onChange={()=>setChoice("bn")}/>বাংলা</label></fieldset><p className="small-muted">You can change this anytime from the language menu.<br/><span lang="bn">ভাষার মেনু থেকে পরে পরিবর্তন করতে পারবেন।</span></p><button className="primary" onClick={()=>setLanguage(choice)}>Continue / এগিয়ে যান</button></dialog>}</Context.Provider>
}
