// Contentful(외부 CMS) 클라이언트 생성
const client = contentful.createClient({
	space: "sss4xnj1z3qx", // Contentful Space ID (프로젝트 폴더 개념)
	accessToken: "LDQ8K1hGw7ygkNLdUqcp_DtJ8oxVSx62S3_5qqx8YOc" // Contentful Access Token
});

// 주요 DOM 객체 변수 선언
const cartBtn = document.querySelector('.cart-btn');            // 장바구니 열기 버튼
const closeCartBtn = document.querySelector('.close-cart');      // 장바구니 닫기 버튼
const clearCartBtn = document.querySelector('.clear-cart');      // 장바구니 비우기 버튼
const cartOverlay = document.querySelector('.cart-overlay');     // 장바구니 오버레이
const cartItems = document.querySelector('.cart-items');         // 장바구니 상품 개수 표시
const cartTotal = document.querySelector('.cart-total');         // 장바구니 총합 표시
const cartContent = document.querySelector('.cart-content');     // 장바구니 내부 상품 목록
const productsDOM = document.querySelector('.products-center');  // 상품 목록 표시 영역

let cart = [];            // 장바구니 배열
let buttonsDOM = [];      // "장바구니 담기" 버튼 배열

// 상품 데이터 가져오기 클래스
class Products {
	async getProducts() {
		try {
			let contentful = await client.getEntries(); // Contentful에서 데이터 받아오기 (현재는 사용 X)
			console.log(contentful); // Contentful 데이터 콘솔 출력 (디버깅용)

			let result = await fetch('products.json');  // 로컬 JSON 파일에서 상품 데이터 가져오기
			let data = await result.json();             // JSON 파싱

			let products = data.items;                  // 상품 배열 추출
			products = products.map(item => {           // 상품 데이터 구조 변환
				const {title, price} = item.fields;     // 상품명, 가격
				const { id } = item.sys;                // 상품 id
				const image = item.fields.image.fields.file.url; // 이미지 경로
				return { title, price, id, image };      // 필요한 정보만 객체로 반환
			});
			return products;                            // 상품 배열 반환
		} catch (error) {
			console.log(error);                         // 에러 발생 시 콘솔 출력
		}
	}
}

// 검색 아이콘, 오버레이, 입력창, 닫기 버튼 선택
const searchBtn = document.getElementById('search-btn');
const searchDropdown = document.getElementById('search-dropdown');
const searchInput = document.getElementById('search-input');
const searchClose = document.getElementById('search-close');
const searchResults = document.getElementById('search-results');

// 검색창 열기
searchBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  searchDropdown.style.display = 'block';
  searchInput.value = '';
  searchResults.innerHTML = '';
  searchInput.focus();
});

// 검색창 닫기 (닫기 버튼)
searchClose.addEventListener('click', () => {
  searchDropdown.style.display = 'none';
});

// 검색창 이외 영역 클릭 시 닫기
document.addEventListener('click', (e) => {
  if (!searchDropdown.contains(e.target) && e.target !== searchBtn) {
    searchDropdown.style.display = 'none';
  }
});

// 2. products.json 데이터 활용
let allProducts = [];
fetch('products.json')
  .then(res => res.json())
  .then(data => {
    // products.json 구조에 따라 수정
    allProducts = data.items.map(item => ({
      title: item.fields.title,
      price: item.fields.price,
      image: item.fields.image.fields.file.url
    }));
  });

// 3. 검색 입력 이벤트
searchInput.addEventListener('input', function() {
  const query = this.value.trim().toLowerCase();
  if (!query) {
    searchResults.innerHTML = '';
    return;
  }
  // 검색: 제품명에 query가 포함된 것만 필터
  const results = allProducts.filter(product =>
    product.title.toLowerCase().includes(query)
  );
  // 제품 결과 표시
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-result-item">검색 결과가 없습니다.</div>';
  } else {
    searchResults.innerHTML = results.map(product => `
      <div class="search-result-item">
        <img src="${product.image}" alt="${product.title}" style="width:40px;height:40px;object-fit:cover;border-radius:0.3rem;margin-right:0.7rem;vertical-align:middle;">
        <span>${product.title}&nbsp;&nbsp;</span>
        <span style="float:right;color:#f09d51;">${product.price.toLocaleString('ko-KR')}원</span>
      </div>
    `).join('');
  }
});


// UI 관련 클래스 (상품 출력, 장바구니 동작 등)
class UI {
	// 상품 목록 화면에 출력
	displayProducts(products) {
		let result = '';
		products.forEach(product => {
			result += `
			<!-- single product -->
			<article class="product">
				<div class="img-container">
					<img
						src=${product.image}
						alt="product" 
						class="product-img"
					/>
					<button class="bag-btn" data-id=${product.id}>
						<i class="fas fa-shopping-cart"></i>
						장바구니에 담기
					</button>
				</div>
				<h3>${product.title}</h3>
				<h4>${product.price.toLocaleString('ko-KR')} &#8361;</h4> <!-- 가격에 천 단위 쉼표, 원화 표시 -->
			</article>
			<!-- end of single product -->
			`;
		});
		productsDOM.innerHTML = result; // 상품 목록 HTML 삽입
	}

	// "장바구니 담기" 버튼 이벤트 연결
	getBagButtons() {
		const buttons = [...document.querySelectorAll(".bag-btn")]; // 모든 장바구니 버튼 배열로
		buttonsDOM = buttons; // 전역에 저장
		buttons.forEach(button => {
			let id = button.dataset.id; // 상품 id
			let inCart = cart.find(item => item.id === id); // 이미 장바구니에 있는지 확인
			if (inCart) {
				button.innerText = "In cart"; // 이미 있으면 비활성화
				button.disabled = true;
			}
			button.addEventListener("click", (event) => { // 클릭 시
				event.target.innerText = "In Cart";
				event.target.disabled = true;
				// 상품 정보 가져오기
				let cartItem = {...Storage.getProduct(id), amount: 1};
				// 장바구니에 추가
				cart = [...cart, cartItem];
				// 로컬스토리지에 저장
				Storage.saveCart(cart);
				// 장바구니 총합/개수 갱신
				this.setCartValues(cart);
				// 장바구니 목록에 상품 추가
				this.addCartItem(cartItem);
				// 장바구니 오버레이 열기
				this.showCart();
			});
		});
	}

	// 장바구니 총합, 상품 개수 계산/표시
	setCartValues(cart) {
		let tempTotal = 0;
		let itemsTotal = 0;
		cart.map(item => {
			tempTotal += item.price * item.amount; // 가격 * 수량
			itemsTotal += item.amount;             // 총 수량
		});
		cartTotal.innerText = parseFloat(tempTotal.toFixed(2)); // 총합(소수점 2자리)
		cartItems.innerText = itemsTotal;                       // 상품 개수
	}

	// 장바구니에 상품 추가(화면에 표시)
	addCartItem(item) {
		const div = document.createElement('div');
		div.classList.add('cart-item');
		div.innerHTML = `
			<img src=${item.image} alt="product">
			<div>
				<h4>${item.title}</h4>
				<h5>${item.price}</h5>
				<span class="remove-item" data-id=${item.id}>remove</span>
			</div>
			<div>
				<i class="fas fa-chevron-up" data-id=${item.id}></i>
				<p class="item-amount">${item.amount}</p>
				<i class="fas fa-chevron-down" data-id=${item.id}></i>
			</div>`;
		cartContent.appendChild(div); // 장바구니 목록에 추가
	}

	// 장바구니 오버레이 열기
	showCart() {
		cartOverlay.classList.add('transparentBcg'); // 오버레이 배경 보이기
		cartDOM.classList.add('ShowCart');           // 장바구니 창 보이기(오타: cartDOM 정의 필요)
	}

	// 앱 초기화 (장바구니 상태 복원, 이벤트 연결)
	setupAPP() {
		cart = Storage.getCart();        // 로컬스토리지에서 장바구니 불러오기
		this.setCartValues(cart);        // 총합/개수 표시
		this.populateCart(cart);         // 장바구니 목록 표시
		cartBtn.addEventListener('click', this.showCart); // 장바구니 열기
		closeCartBtn.addEventListener('click', this.hideCart); // 장바구니 닫기
	}

	// 장바구니에 담긴 상품 모두 표시
	populateCart(cart) {
		cart.forEach(item => this.addCartItem(item));
	}

	// 장바구니 오버레이 닫기
	hideCart() {
		cartOverlay.classList.remove('transparentBcg'); // 오버레이 배경 숨기기
		cartDOM.classList.remove('ShowCart');           // 장바구니 창 숨기기(오타: cartDOM 정의 필요)
	}

	// 장바구니 내 기능(삭제, 수량조절, 비우기) 이벤트 연결
	cartLogic() {
		// 장바구니 비우기 버튼
		clearCartBtn.addEventListener("click", () => {
			this.clearCart();
		});
		// 장바구니 내에서 삭제/수량조절
		cartContent.addEventListener("click", event => {
			if (event.target.classList.contains('remove-item')) {
				let removeItem = event.target;
				let id = removeItem.dataset.id;
				cartContent.removeChild(removeItem.parentElement.parentElement); // 상품 DOM에서 삭제
				this.removeItem(id); // 장바구니 배열/스토리지에서 삭제
			} else if (event.target.classList.contains("fa-chevron-up")) {
				let addAmount = event.target;
				let id = addAmount.dataset.id;
				let tempItem = cart.find(item => item.id === id);
				tempItem.amount = tempItem.amount + 1; // 수량 증가
				Storage.saveCart(cart);
				this.setCartValues(cart);
				addAmount.nextElementSibling.innerText = tempItem.amount; // 수량 표시 갱신
			} else if (event.target.classList.contains("fa-chevron-down")) {
				let lowerAmount = event.target;
				let id = lowerAmount.dataset.id;
				let tempItem = cart.find(item => item.id === id);
				tempItem.amount = tempItem.amount - 1; // 수량 감소
				if (tempItem.amount > 0) {
					Storage.saveCart(cart);
					this.setCartValues(cart);
					lowerAmount.previousElementSibling.innerText = tempItem.amount;
				} else {
					cartContent.removeChild(lowerAmount.parentElement.parentElement); // 수량 0이면 DOM에서 삭제
					this.removeItem(id); // 장바구니 배열/스토리지에서 삭제
				}
			}
		});
	}

	// 장바구니 전체 비우기
	clearCart() {
		let cartItems = cart.map(item => item.id); // 모든 상품 id 배열로
		cartItems.forEach(id => this.removeItem(id)); // 하나씩 삭제
		while (cartContent.children.length > 0) {
			cartContent.removeChild(cartContent.children[0]); // DOM에서 모두 삭제
		}
		this.hideCart(); // 장바구니 닫기
	}

	// 장바구니에서 특정 상품 삭제
	removeItem(id) {
		cart = cart.filter(item => item.id !== id); // 배열에서 삭제
		this.setCartValues(cart);                   // 총합/개수 갱신
		Storage.saveCart(cart);                     // 로컬스토리지 갱신
		let button = this.getSingleButton(id);      // 해당 상품의 "장바구니 담기" 버튼 찾기
		button.disabled = false;                    // 버튼 활성화
		button.innerHTML = `<i class="fas fa-shopping-cart"></i>장바구니에 담기`; // 텍스트 복원
	}

	// 특정 상품의 "장바구니 담기" 버튼 찾기
	getSingleButton(id) {
		return buttonsDOM.find(button => button.dataset.id === id);
	}
}

// 로컬스토리지 관리 클래스
class Storage {
	static saveProducts(products) {
		localStorage.setItem("products", JSON.stringify(products)); // 상품 목록 저장
	}
	static getProduct(id) {
		let products = JSON.parse(localStorage.getItem('products')); // 상품 목록 불러오기
		return products.find(product => product.id === id);          // id로 상품 찾기
	}
	static saveCart(cart) {
		localStorage.setItem("cart", JSON.stringify(cart)); // 장바구니 저장
	}
	static getCart() {
		return localStorage.getItem("cart")
			? JSON.parse(localStorage.getItem("cart"))      // 장바구니 불러오기
			: [];
	}
}

// 페이지 로드 시 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
	const ui = new UI();             // UI 인스턴스 생성
	const products = new Products(); // Products 인스턴스 생성

	ui.setupAPP();                   // 장바구니 상태 복원, 이벤트 연결

	products
		.getProducts()               // 상품 데이터 가져오기
		.then(products => {
			ui.displayProducts(products);      // 상품 목록 화면에 출력
			Storage.saveProducts(products);    // 상품 목록 로컬스토리지에 저장
		})
		.then(() => {
			ui.getBagButtons();                // "장바구니 담기" 버튼 이벤트 연결
			ui.cartLogic();                    // 장바구니 내 기능 이벤트 연결
		});
});


// 햄버거 아이콘, 메뉴 오버레이, 닫기 버튼 선택
const menuBtn = document.querySelector('.fa-bars');
const menuOverlay = document.querySelector('.menu-overlay');
const closeMenuBtn = document.querySelector('.close-menu');

// 햄버거 클릭 → 메뉴 오버레이 열기
menuBtn.addEventListener('click', function() {
  menuOverlay.classList.add('showMenu');
});

// 닫기 버튼 클릭 → 메뉴 오버레이 닫기
closeMenuBtn.addEventListener('click', function() {
  menuOverlay.classList.remove('showMenu');
});
