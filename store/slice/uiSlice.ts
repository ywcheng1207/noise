import { createSlice } from '@reduxjs/toolkit'

interface UiState {
	mobileNavOpen: boolean
}

const initialState: UiState = {
	mobileNavOpen: false,
}

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		toggleMobileNav(state) {
			state.mobileNavOpen = !state.mobileNavOpen
		},
	},
})

export const { toggleMobileNav } = uiSlice.actions
export default uiSlice.reducer
