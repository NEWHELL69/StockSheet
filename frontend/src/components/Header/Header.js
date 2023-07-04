import {  useEffect } from 'react';
import './header.css'

function Header() {
  useEffect(() => {
    const header = document.querySelector(".header");
    const headerOpenBtn = document.querySelector("#header-open-btn");
    const headerCloseBtn = document.querySelector("#header-close-btn");

    const openHeader = (e) => {
      header.setAttribute("data-state", "open");
      headerOpenBtn.setAttribute("data-state", "hidden");
    }

    const closeHeader = (event) => {
      event.stopPropagation();
      header.setAttribute("data-state", "close");
      headerOpenBtn.setAttribute("data-state", "");
    }

    const unHoverHeader = (e) => {
      header.setAttribute("data-pseudostate", "");
    }

    header.addEventListener('click', openHeader);
    headerOpenBtn.addEventListener('click', openHeader);
    headerCloseBtn.addEventListener('click', closeHeader)

    header.addEventListener('touchstart', unHoverHeader);

    return () => {
      header.removeEventListener('click', openHeader);
      headerOpenBtn.removeEventListener('click', openHeader);
      headerCloseBtn.removeEventListener('click', closeHeader)


      header.removeEventListener('touchstart', unHoverHeader);
    }
  }, []);

  return (
    <div className="header" data-state="close" data-pseudostate="hover">
      <p>Hello, I am inside Header component!</p>
      <button id="header-close-btn">close</button>
    </div>
  );
}

export default Header;
