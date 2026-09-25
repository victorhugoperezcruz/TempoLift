import { memo } from 'react'

const BackgroundOrbs = memo(function BackgroundOrbs() {
	return (
		<div className="bg-orbs" aria-hidden="true">
			<span className="orb orb-a" />
			<span className="orb orb-b" />
		</div>
	)
})

export default BackgroundOrbs
