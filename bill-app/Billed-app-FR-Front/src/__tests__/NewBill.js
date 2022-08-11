/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH  } from "../constants/routes";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import { bills } from "../fixtures/bills"

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

beforeAll(() => {
  jest.spyOn(global.console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  global.console.log.mockRestore();
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the send new bill form is display", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
      expect(screen.queryByText("Envoyer une note de frais")).toBeTruthy();
    })
  })

  describe("When I am on NewBill Page and I select a file", ()=>{

    test("Then the function handleChangeFile is called",async ()=>{
      document.body.innerHTML = NewBillUI();
      
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      }))
      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const store = jest.fn();

      const newBill = new NewBill({
        document,
        localStorage: window.localStorage,
        onNavigate,
        store,
      })

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      const testFile = {
        target: {
          files: [new File(['image.jpg'], 'image.jpg', {
              type: 'image/jpg'
            })]
          }
        }
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener('change', handleChangeFile)
      fireEvent.change(inputFile,testFile)
      expect(handleChangeFile).toHaveBeenCalled();
    })
  })

  // test d'intégration POST
  describe("When I am on NewBill Page and I submit the form with all required field valid", ()=>{
    test("Then the bill is submitted",async ()=>{
      document.body.innerHTML = NewBillUI();
      const inputData = {
        email: "",
        type: "Transports",
        name:  "Test bill",
        amount: 114,
        date:  "2022-07-10",
        vat: 19,
        pct: 20,
        commentary: "envoie pour test",
        fileUrl: "image/photo.jpg",
        fileName: "photo.jpg",
        status: "pending",
      };

      const inputType = screen.getByTestId("expense-type");
      fireEvent.change(inputType, {
        target: { value: inputData.type },
      });
      expect(inputType.value).toBe(inputData.type);

      const inputName = screen.getByTestId("expense-name");
      fireEvent.change(inputName, {
        target: { value: inputData.name },
      });
      expect(inputName.value).toBe(inputData.name);

      const inputAmount = screen.getByTestId("amount");
      fireEvent.change(inputAmount, {
        target: { value: inputData.amount },
      });
      expect(inputAmount).toHaveProperty("required");
      expect(parseInt(inputAmount.value)).toBe(inputData.amount);

      const inputDate = screen.getByTestId("datepicker");
      fireEvent.change(inputDate, {
        target: { value: inputData.date },
      });
      expect(inputDate).toHaveProperty("required");
      expect(inputDate.value).toBe(inputData.date);

      const inputVat = screen.getByTestId("vat");
      fireEvent.change(inputVat, {
        target: { value: inputData.vat },
      });
      expect(parseInt(inputVat.value)).toBe(inputData.vat);

      const inputPct = screen.getByTestId("pct");
      fireEvent.change(inputPct, {
        target: { value: inputData.pct },
      });
      expect(inputPct).toHaveProperty("required");
      expect(parseInt(inputPct.value)).toBe(inputData.pct);

      const inputComment = screen.getByTestId("commentary");
      fireEvent.change(inputComment, {
        target: { value: inputData.commentary },
      });
      expect(inputComment.value).toBe(inputData.commentary);

      const testFile = new File(["test"], "test.png", {type: "image/png"})
      const inputFile = screen.getByTestId("file");
      userEvent.upload(inputFile,testFile)

      expect(inputFile).toHaveProperty("required");
      expect(inputFile.files[0]).toBe(testFile);
      expect(inputFile.files.length).toBe(1);

      const form = screen.getByTestId("form-new-bill")
      
      // localStorage should be populated with form data
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      }))

      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const store = jest.fn();

      const newBill = new NewBill({
        document,
        localStorage: window.localStorage,
        onNavigate,
        store,
      })

      const handleSubmit = jest.fn(NewBill.handleSubmit)
      newBill.updateBill = jest.fn().mockResolvedValue({});
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(newBill.updateBill).toHaveBeenCalled();

    })

    test("It should render Bills page", async ()=>{
      const billsPage = await waitFor( ()=>screen.queryByText("Mes notes de frais"))
      expect(billsPage).toBeTruthy();
    })
    
  })
})
